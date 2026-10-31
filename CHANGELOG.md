# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## [1.0.21] - 2026-10-31

### Changed

- Require Python 3.12

## [1.0.20] - 2026-10-31

### Changed

- Apply the template files and packages the upgrade left out

## [1.0.17] - 2026-10-30

### Changed

- Upgrade to extension template v4.6.5 and Makefile 1.46

### Fixed

- Take the scoped @stellarshenson/jupyterlab-file-browser-sorting-extension npm name

## [1.0.15] - 2026-06-22

### Fixed

- File browser no longer crashes with `TypeError: this.listing.sortedItems is not a function` during focus and keyboard navigation on JupyterLab 4.6 - the extension no longer overrides core `DirListing.sortedItems` with a getter, so the native method keeps returning the expected iterator

<!-- <END NEW CHANGELOG ENTRY> -->
