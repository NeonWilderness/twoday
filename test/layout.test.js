const fs = require('fs');
const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod', { silent: true });
const alias = 'foundation';
const layoutName = 'alien';

describe('Can work with Twoday layouts', () => {
  xit('should get the layout data', async () => {
    await td.login();
    const layout = await td.getLayout(alias);
    expect(layout.layoutNames).toContain('twoday30');
    expect(layout.layoutNames).toContain('alien');
    expect(layout.layoutNames).toContain('twodayclassic1');
    expect(layout.activeLayoutName).toBe('twoday30');
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  xit('should get the layout url', async () => {
    await td.login();
    const url = await td.getActiveLayoutUrl(alias);
    expect(url).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  xit('should get the layout name', async () => {
    await td.login();
    const name = await td.getActiveLayoutName(alias);
    expect(name).toBe('twoday30');
  });

  xit('should use another layout name', async () => {
    await td.login();
    const layout = await td.useLayout(alias, layoutName);
    expect(layout.activeLayoutName).toBe(layoutName);
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/alien');
  });

  xit('should throw when layout name is missing', async () => {
    try {
      await td.login();
      await td.useLayout(alias);
    } catch (e) {
      expect(e.message).toMatch(/Missing layout name/);
    }
  });

  xit('should throw when layout name does not exist', async () => {
    try {
      await td.login();
      await td.useLayout(alias, 'unkownLayoutName');
    } catch (e) {
      expect(e.message).toMatch(/does not exist/);
    }
  });

  xit('should retain a changed layout name', async () => {
    await td.login();
    const layout = await td.useLayout(alias, 'alien');
    expect(layout.activeLayoutName).toBe('alien');
    const layoutName = await td.getActiveLayoutName(alias);
    expect(layoutName).toBe('alien');
  });

  it('should refresh a previously changed layout name', async () => {
    await td.login();
    const layoutInitial = await td.getLayout(alias);
    expect(layoutInitial.activeLayoutName).toBe('twoday30');

    const layoutUsed = await td.useLayout(alias, 'alien');
    expect(layoutUsed.activeLayoutName).toBe('alien');
    
    const layoutRefreshed = await td.getLayout(alias, true);
    expect(layoutRefreshed.activeLayoutName).toBe('twoday30');
  });

  xit('should download a layout as a zip file', async () => {
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
