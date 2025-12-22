import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Contents } from '@jupyterlab/services';

const PLUGIN_ID = 'jupyterlab_file_browser_sorting_extension:plugin';
const COMMAND_TOGGLE_UNIX_SORT = 'filebrowser:toggle-unix-sorting';

/**
 * LC_COLLATE=C (ASCIIbetical) comparison function.
 *
 * Sort order:
 * 1. Dot files first (. before alphanumeric)
 * 2. Numbers (0-9)
 * 3. Uppercase letters (A-Z)
 * 4. Underscore (_)
 * 5. Lowercase letters (a-z)
 *
 * This matches the standard Unix `ls` behavior with LC_COLLATE=C.
 */
function cLocaleCompare(a: string, b: string): number {
  const lenA = a.length;
  const lenB = b.length;
  const minLen = Math.min(lenA, lenB);

  for (let i = 0; i < minLen; i++) {
    const charCodeA = a.charCodeAt(i);
    const charCodeB = b.charCodeAt(i);

    if (charCodeA !== charCodeB) {
      return charCodeA - charCodeB;
    }
  }

  return lenA - lenB;
}

/**
 * Default locale comparison (case-insensitive with numeric sorting).
 */
function defaultLocaleCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

/**
 * Sort items using the specified comparison function.
 *
 * @param items - Iterator of content items
 * @param state - Sort state (direction and key)
 * @param sortNotebooksFirst - Whether to sort notebooks before other files
 * @param useCLocale - Whether to use C locale sorting
 * @returns Sorted array of items
 */
function sortItems(
  items: IterableIterator<Contents.IModel>,
  state: { direction: 'ascending' | 'descending'; key: string },
  sortNotebooksFirst: boolean,
  useCLocale: boolean
): Contents.IModel[] {
  const copy = Array.from(items);
  const reverse = state.direction === 'descending' ? -1 : 1;

  /**
   * Priority comparison for directories and notebooks.
   */
  function getPriority(item: Contents.IModel): number {
    if (item.type === 'directory') {
      return 0; // Directories first
    }
    if (sortNotebooksFirst && item.type === 'notebook') {
      return 1; // Notebooks second
    }
    return 2; // Other files last
  }

  /**
   * Compare two items by name using the appropriate comparison function.
   */
  function compareByName(a: Contents.IModel, b: Contents.IModel): number {
    if (useCLocale) {
      return cLocaleCompare(a.name, b.name);
    }
    return defaultLocaleCompare(a.name, b.name);
  }

  /**
   * Main comparison function that applies priority then specific comparator.
   */
  function compare(
    comparator: (a: Contents.IModel, b: Contents.IModel) => number
  ): (a: Contents.IModel, b: Contents.IModel) => number {
    return (a: Contents.IModel, b: Contents.IModel): number => {
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within same priority, use the provided comparator
      const result = comparator(a, b);
      return result * reverse;
    };
  }

  if (state.key === 'last_modified') {
    copy.sort(
      compare((a, b) => {
        return (
          new Date(a.last_modified).getTime() -
          new Date(b.last_modified).getTime()
        );
      })
    );
  } else if (state.key === 'file_size') {
    copy.sort(
      compare((a, b) => {
        return (b.size ?? 0) - (a.size ?? 0);
      })
    );
  } else {
    // Sort by name
    copy.sort(compare(compareByName));
  }

  return copy;
}

/**
 * Initialization data for the jupyterlab_file_browser_sorting_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description:
    'JupyterLab extension for LC_COLLATE=C file browser sorting (dot files first, uppercase before lowercase)',
  autoStart: true,
  requires: [IFileBrowserFactory],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log(
      'JupyterLab extension jupyterlab_file_browser_sorting_extension is activated!'
    );

    const { commands } = app;
    const { tracker } = factory;

    let sortNotebooksFirst = false;
    let useCLocaleSorting = true; // Default enabled

    // Store patched browsers to trigger re-sort when settings change
    const patchedBrowsers: Set<any> = new Set();

    /**
     * Re-sort all patched file browsers.
     */
    function resortAllBrowsers(): void {
      patchedBrowsers.forEach(browser => {
        const listing = (browser as any)._listing;
        if (listing) {
          const currentState = listing.sortState;
          if (currentState) {
            listing.sort(currentState);
          }
        }
      });
    }

    // Load settings for sortNotebooksFirst preference from filebrowser
    if (settingRegistry) {
      settingRegistry
        .load('@jupyterlab/filebrowser-extension:browser')
        .then(settings => {
          const updateSortNotebooksFirst = () => {
            sortNotebooksFirst =
              (settings.get('sortNotebooksFirst').composite as boolean) ??
              false;
            resortAllBrowsers();
          };
          updateSortNotebooksFirst();
          settings.changed.connect(updateSortNotebooksFirst);
        })
        .catch(reason => {
          console.warn(
            'Could not load filebrowser settings, using defaults:',
            reason
          );
        });

      // Load our extension's settings
      settingRegistry
        .load(PLUGIN_ID)
        .then(settings => {
          const updateUseCLocaleSorting = () => {
            useCLocaleSorting =
              (settings.get('useCLocaleSorting').composite as boolean) ?? true;
            resortAllBrowsers();
          };
          updateUseCLocaleSorting();
          settings.changed.connect(updateUseCLocaleSorting);
        })
        .catch(reason => {
          console.warn(
            'Could not load extension settings, using defaults:',
            reason
          );
        });
    }

    // Register toggle command
    commands.addCommand(COMMAND_TOGGLE_UNIX_SORT, {
      label: 'Use Unix-Style Sorting (LC_COLLATE=C)',
      caption:
        'Sort files using Unix C locale order: dot files first, uppercase before lowercase',
      isToggleable: true,
      isToggled: () => useCLocaleSorting,
      execute: async () => {
        if (settingRegistry) {
          const settings = await settingRegistry.load(PLUGIN_ID);
          await settings.set('useCLocaleSorting', !useCLocaleSorting);
        }
      }
    });

    // Add to file browser context menu (View submenu area)
    app.contextMenu.addItem({
      command: COMMAND_TOGGLE_UNIX_SORT,
      selector: '.jp-DirListing-content',
      rank: 10.5 // Place near "Sort Notebooks Above Files" which is typically around rank 10
    });

    /**
     * Patch a FileBrowser's DirListing to use custom sorting.
     */
    function patchFileBrowser(browser: any): void {
      // Access the internal listing property
      const listing = (browser as any)._listing;
      if (!listing) {
        console.warn('Could not access file browser listing');
        return;
      }

      // Track this browser
      patchedBrowsers.add(browser);

      // Override the sort method
      listing.sort = function (state: {
        direction: 'ascending' | 'descending';
        key: string;
      }): void {
        // Get the model's items
        const model = this.model;
        if (!model) {
          return;
        }

        // Perform sorting with current settings
        const sorted = sortItems(
          model.items(),
          state,
          sortNotebooksFirst,
          useCLocaleSorting
        );

        // Update the internal sorted items array
        (this as any)._sortedItems = sorted;
        (this as any)._sortState = state;

        // Trigger UI update
        this.update();
      };

      // Re-sort with current state to apply settings immediately
      const currentState = listing.sortState;
      if (currentState) {
        listing.sort(currentState);
      }

      console.log('Patched file browser with custom sorting');
    }

    // Patch existing file browsers
    tracker.forEach(browser => {
      patchFileBrowser(browser);
    });

    // Patch new file browsers when they're added
    tracker.widgetAdded.connect((sender, browser) => {
      patchFileBrowser(browser);
    });

    // Clean up when browsers are disposed
    tracker.widgetUpdated.connect((sender, browser) => {
      if (browser.isDisposed) {
        patchedBrowsers.delete(browser);
      }
    });
  }
};

export default plugin;
