const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod', { silent: true });

describe('Can work with Alien blogs', () => {
  it('should get the proper alien software version', async () => {
    let version = await td.checkUserAlienVersion('mmm');
    expect(version).not.toBe('N/A');
    version = await td.checkUserAlienVersion('cdn');
    expect(version).toBe('N/A');
  });
});

describe('Can return info about an alias', () => {
  it('should get infos about a normal alias', async () => {
    await td.login();
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
    await td.login();
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
    await td.login();
    const url = await td.getStaticUrl('neonwilderness');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/');
  });
  
  it('should return the static URL with a resType "images"', async () => {
    await td.login();
    const url = await td.getStaticUrl('neonwilderness', 'images');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/images/');
  });
  
  it('should return the static URL with a resType "files"', async () => {
    await td.login();
    const url = await td.getStaticUrl('neonwilderness', 'files');
    expect(url).toBe('https://static.twoday.net/NeonWilderness/files/');
  });
});
