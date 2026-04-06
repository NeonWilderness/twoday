const fs = require('node:fs');
const path = require('node:path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(20000);
const td = new Twoday.Twoday('prod', { silent: true });
const alias = 'foundation';
const layoutName = 'alien';

describe('Can work with Twoday layouts', () => {
  beforeAll(async () => {
    await td.login({ silent: true });
  });

  afterAll(async () => {
    await td.logout();
  });

  it('should get the layout data', async () => {
    const layout = await td.getLayout(alias);
    expect(layout.layoutNames).toContain('twoday30');
    expect(layout.layoutNames).toContain('alien');
    expect(layout.layoutNames).toContain('twodayclassic1');
    expect(layout.activeLayoutName).toBe('twoday30');
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  it('should get the layout url', async () => {
    const url = await td.getActiveLayoutUrl(alias);
    expect(url).toBe('https://foundation.twoday.net/layouts/twoday30');
  });

  it('should get the layout name', async () => {
    const name = await td.getActiveLayoutName(alias);
    expect(name).toBe('twoday30');
  });

  it('should use another layout name', async () => {
    const layout = await td.useLayout(alias, layoutName);
    expect(layout.activeLayoutName).toBe(layoutName);
    expect(layout.activeLayoutUrl).toBe('https://foundation.twoday.net/layouts/alien');
  });

  it('should throw when layout name is missing', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await td.useLayout(alias, null);
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should throw when layout name does not exist', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await td.useLayout(alias, 'unkownLayoutName');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('should retain a changed layout name', async () => {
    const layout = await td.useLayout(alias, 'alien');
    expect(layout.activeLayoutName).toBe('alien');
    const layoutName = await td.getActiveLayoutName(alias);
    expect(layoutName).toBe('alien');
  });

  it('should refresh a previously changed layout name', async () => {
    const layoutInitial = await td.getLayout('nberlin');
    expect(layoutInitial.activeLayoutName).toBe('alien');

    const layoutUsed = await td.useLayout('nberlin', 'export');
    expect(layoutUsed.activeLayoutName).toBe('export');

    const layoutRefreshed = await td.getLayout('nberlin', true);
    expect(layoutRefreshed.activeLayoutName).toBe('alien');
  });

  it('should return modified skins of a changed layout name', async () => {
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
    await td.downloadLayout(alias, layout);
    const stats = fs.statSync(layout.path);
    const fileSizeInBytes = stats.size;
    expect(fileSizeInBytes).toBeGreaterThan(70000);
  });
});
