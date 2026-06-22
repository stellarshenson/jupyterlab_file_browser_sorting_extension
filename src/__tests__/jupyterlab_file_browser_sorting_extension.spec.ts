import * as fs from 'fs';
import * as path from 'path';

describe('jupyterlab_file_browser_sorting_extension', () => {
  // Guards against the JupyterLab 4.6 focus crash: core DirListing.sortedItems
  // is a method returning an iterator, so the extension must not shadow it with
  // a property/getter. The custom order is driven by `this._sortedItems` instead.
  it('does not define a sortedItems property on the listing', () => {
    const src = fs
      .readFileSync(path.resolve(__dirname, '..', 'index.ts'), 'utf-8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(src).not.toMatch(/defineProperty\([^,]+,\s*['"]sortedItems['"]/);
    expect(src).not.toMatch(/\bsortedItems\s*[:=]/);
  });
});
