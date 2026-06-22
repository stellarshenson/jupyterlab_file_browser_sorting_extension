# Changelog

<!-- <START NEW CHANGELOG ENTRY> -->

## [1.0.15] - 2026-06-22

### Fixed

- File browser no longer crashes with `TypeError: this.listing.sortedItems is not a function` during focus and keyboard navigation on JupyterLab 4.6 - the extension no longer overrides core `DirListing.sortedItems` with a getter, so the native method keeps returning the expected iterator

<!-- <END NEW CHANGELOG ENTRY> -->
