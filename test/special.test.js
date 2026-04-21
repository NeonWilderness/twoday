const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(20000);
const td = new Twoday.Twoday('prod', { silent: true });

describe('Can work with Alien blogs', () => {
  it('should get the proper alien software version', async () => {
    let version = await td.checkUserAlienVersion('mmm');
    expect(version).not.toBe('N/A');
    version = await td.checkUserAlienVersion('cdn');
    expect(version).toBe('N/A');
  });
});

describe('Can do special Twoday tasks', () => {
  beforeAll(async () => {
    await td.login({ silent: true });
  });

  afterAll(async () => {
    await td.logout();
  });

  it('should get infos about a normal alias', async () => {
    const infos = await td.getInfo('neonwilderness');
    console.log(infos);
    expect(typeof infos).toBe('object');
    expect(infos).not.toBeNull();
    expect(Object.keys(infos)).toHaveLength(9);
    expect(infos.creator).toBe('NeonWilderness');
    expect(infos.createDate).toBe('24.10.2006 01:52');
    expect(infos.stories).toBeGreaterThan(390);
    expect(infos.comments).toBeGreaterThan(5770);
    expect(infos.images).toBeGreaterThan(70);
    expect(infos.files).toBeGreaterThan(4);
    expect(infos.diskUsage).toBeGreaterThan(6.5);
    expect(infos.usedKB).toBeGreaterThan(5970);
    expect(infos.trustedSite).toBeFalsy();
  });

  it('should get infos about a trusted site alias', async () => {
    const infos = await td.getInfo('kunstbetrieb');
    console.log(infos);
    expect(typeof infos).toBe('object');
    expect(infos).not.toBeNull();
    expect(Object.keys(infos)).toHaveLength(9);
    expect(infos.creator).toBe('kunstbetrieb');
    expect(infos.createDate).toBe('07.11.2008 00:31');
    expect(infos.diskUsage).toBe(0);
    expect(infos.usedKB).toBeGreaterThan(102400);
    expect(infos.trustedSite).toBeTruthy();
  });

  it('should return the static URL without resType', async () => {
    const url = await td.getStaticUrl('neonwilderness');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/');
  });

  it('should return the static URL with a resType "images"', async () => {
    const url = await td.getStaticUrl('neonwilderness', 'images');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/images/');
  });

  it('should return the static URL with a resType "files"', async () => {
    const url = await td.getStaticUrl('neonwilderness', 'files');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/files/');
  });

  it('should return the sidebar modules order', async () => {
    const sidebarModules = await td.getSidebarModules('www');
    expect(sidebarModules.sidebar01).toBeTruthy();
    expect(sidebarModules.sidebar02).toBeTruthy();
    expect(sidebarModules.sidebar01).toHaveLength(4);
    expect(sidebarModules.sidebar02).toHaveLength(0);
  });

  it('should read and log the content of all sidebar freetext modules', async () => {
    const alias = 'www';
    const sidebarModules = await td.getSidebarModules(alias);
    const freetextModules = sidebarModules.sidebar01.filter(module => module.includes('FreeText'));
    expect(freetextModules).toHaveLength(2);
    console.log(freetextModules);

    for (const mod of freetextModules) {
      const { heading, content } = await td.getFreeTextModule(alias, mod);
      expect(heading).toBeTruthy();
      expect(content).toBeTruthy();
      console.log(mod, `(${heading}) => ${content}`);
    }
  });

  it('should get the module heading/skins of non-freetext modules', async () => {
    const alias = 'www';
    const sidebarModules = await td.getSidebarModules(alias);
    const skinModules = sidebarModules.sidebar01.filter(module => !module.includes('FreeText'));
    expect(skinModules).toHaveLength(2);
    console.log(skinModules);

    for (const mod of skinModules) {
      const { heading, skins } = await td.getModuleSkins(alias, mod);
      expect(heading).toBeTruthy();
      expect(skins).toBeTruthy();
      expect(Array.isArray(skins)).toBe(true);
      for (const s in skins) {
        const keys = Object.keys(skins[s]);
        expect(keys).toHaveLength(2);
        expect(keys).toContain('name');
        expect(keys).toContain('url');
      }
      console.log(mod, `(${heading}) => ${JSON.stringify(skins, null, 2)}`);
    }
  });
});
