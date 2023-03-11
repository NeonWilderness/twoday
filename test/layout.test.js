const fs = require('fs');
const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod', { silent: true });
const alias = 'foundation';
const layoutName = 'alien';

describe('Can work with Twoday layouts', () => {
  it('should get the layout data', async () => {
    await td.login();
    const layout = await td.getLayout(alias);
    expect(layout.layoutNames).toContain('twoday30');
    expect(layout.layoutNames).toContain('alien');
    expect(layout.layoutNames).toContain('twodayclassic1');
    expect(layout.activeLayoutName).toBe('twoday30');
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  it('should get the layout url', async () => {
    await td.login();
    const url = await td.getActiveLayoutUrl(alias);
    expect(url).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  it('should get the layout name', async () => {
    await td.login();
    const name = await td.getActiveLayoutName(alias);
    expect(name).toBe('twoday30');
  });

  it('should use another layout name', async () => {
    await td.login();
    const layout = await td.useLayout(alias, layoutName);
    expect(layout.activeLayoutName).toBe(layoutName);
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/alien');
  });

  it('should throw when layout name is missing', async () => {
    await td.login();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await td.useLayout(alias);
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should throw when layout name does not exist', async () => {
    await td.login();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await td.useLayout(alias, 'unkownLayoutName');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should retain a changed layout name', async () => {
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

  it('should return modified skins of a changed layout name', async () => {
    await td.login();
    const testAlias = 'neonwilderness';
    const layoutInitial = await td.getLayout(testAlias);
    expect(layoutInitial.activeLayoutName).toBe('rainy');

    const layoutUsed = await td.useLayout(testAlias, 'export');
    expect(layoutUsed.activeLayoutName).toBe('export');

    const modSkins = await td.getModifiedSkins(testAlias);
    expect(modSkins.length).toBe(11);
    expect(modSkins.filter(skin => skin.name === 'Site.twodayExport')).toHaveLength(1);
  });

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
