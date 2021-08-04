const fs = require('fs');
const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');
const alias = 'foundation';
const layoutName = 'alien';

describe('Can work with Twoday layouts', () => {
  it('should download a layout as a zip file', async () => {
    const layout = {
      name: layoutName,
      path: path.resolve(process.cwd(), 'test', `${layoutName}-layout.zip`)
    };
    await td.login();
    await td.downloadLayout(alias, layout);
    const stats = fs.statSync(layout.path);
    const fileSizeInBytes = stats.size;
    expect(fileSizeInBytes).toBeGreaterThan(70000);
  });
});
