const Twoday = require('../src/index');
require('dotenv-safe').config();
jest.setTimeout(20000);
const td = new Twoday.Twoday('dev', { silent: true });
const alias = 'sysmgr';
const layoutName = 'responsive';

describe('Can login and do sysmgr tasks', () => {
  beforeAll(async () => {
    await td.login();
  });

  afterAll(async () => {
    await td.logout();
  });

  it('should get a list of sysmgr layouts', async () => {
    const layout = await td.getLayout(alias);
    expect(layout.layoutNames).toContain('responsive');
    expect(layout.layoutNames.length).toBeGreaterThan(12);
    expect(layout.activeLayoutName).toHaveLength(0);
    expect(layout.activeLayoutUrl).toBe(`${td.baseUrl}/layouts`);
  });

  it('should use a specific layout', async () => {
    const layout = await td.useLayout(alias, layoutName);
    expect(layout.activeLayoutName).toBe(layoutName);
    expect(layout.activeLayoutUrl).toBe(`${td.baseUrl}/layouts/${layoutName}`);
  });

  it('should provide a user list for a user substring', async () => {
    const userlist = await td.getSysMgrUsers('neon');
    //console.log(userlist);
    expect(Array.isArray(userlist)).toBeTruthy();
    expect(userlist.length).toBeGreaterThan(20);
  });

  it('should get a list of modified skins', async () => {
    const layout = await td.useLayout(alias, layoutName);
    //console.log(layout);
    const modSkins = await td.getModifiedSkins(alias);
    //console.log(modSkins);
    expect(Array.isArray(modSkins)).toBeTruthy();
    expect(modSkins.length).toBeGreaterThan(70);
  });

  it('should validate a modified skin', async () => {
    const layout = await td.useLayout(alias, layoutName);
    const mod = await td.isModifiedSkin(alias, 'Choice.main');
    console.log(mod);
    expect(mod.isModified).toBeTruthy();
    expect(mod.url).toBeTruthy();
  });
});
