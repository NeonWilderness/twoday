const Twoday = require('../src/index.js');
require('dotenv-safe').config();

describe('Can instantiate a valid Twoday class', () => {
  it('should work with platform=prod', () => {
    const td = new Twoday('prod');
    expect(td.platform).toBe('prod');
    expect(td.fullDomain).toBe('twoday.net');
    expect(td.baseUrl).toBe('https://twoday.net');
    expect(typeof td.layoutUrl).toBe('object');
    expect(Object.keys(td.layoutUrl)).toHaveLength(0);
    expect(td.delay).toBe(20);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20190210a');
    expect(c.domain).toBe('twoday.net');
    expect(c.secure).toBeTruthy();
  });

  it('should work with platform=dev', () => {
    const td = new Twoday('dev');
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday.xyz');
    expect(td.baseUrl).toBe('https://twoday.xyz');
    expect(typeof td.layoutUrl).toBe('object');
    expect(Object.keys(td.layoutUrl)).toHaveLength(0);
    expect(td.delay).toBe(20);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20190210a');
    expect(c.domain).toBe('twoday.xyz');
    expect(c.secure).toBeTruthy();
  });

  it('should error with platform=xxx', () => {
    expect(() => new Twoday('xxx')).toThrow(Error);
  });

  it('should consider platform=dev, delay=40, agreed=20210517b', () => {
    const td = new Twoday('dev', { delay: 40, agreedVersion: '20210517b', silent: true });
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday.xyz');
    expect(typeof td.layoutUrl).toBe('object');
    expect(Object.keys(td.layoutUrl)).toHaveLength(0);
    expect(td.delay).toBe(40);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20210517b');
    expect(c.domain).toBe('twoday.xyz');
    expect(c.secure).toBeTruthy();
  });

  it('should respect private methods', () => {
    const td = new Twoday('dev');
    expect(() => td.getDomain()).toThrow();
    expect(() => td.getSecretKey()).toThrow();
  });

  it('should get proper DEV alias domains', () => {
    const td = new Twoday('dev');
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday.xyz');
    expect(td.getAliasDomain('info')).toBe('https://info.twoday.xyz');
    expect(() => td.getAliasDomain('')).toThrow();
    expect(() => td.getAliasDomain()).toThrow();
  });

  it('should get proper PROD alias domains', () => {
    const td = new Twoday('prod');
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday.net');
    expect(td.getAliasDomain('info')).toBe('https://info.twoday.net');
    expect(() => td.getAliasDomain('')).toThrow();
    expect(() => td.getAliasDomain()).toThrow();
  });

  it('should save/return the layoutUrl of an alias', () => {
    const td = new Twoday('dev', { silent: true });
    const alias = 'neonwilderness';
    const wantedUrl = 'https://neonwilderness.twoday.xyz/layouts/rainy';
    return td.login()
      .then(() => td.getLayoutUrl(alias))
      .then(url => {
        expect(url.length).toBeTruthy();
        expect(url).toBe(wantedUrl);
        expect(Object.keys(td.layoutUrl)).toHaveLength(1);
        expect(alias in td.layoutUrl).toBeTruthy();
        expect(td.layoutUrl[alias]).toBe(wantedUrl);
      })
  });

  it('should return the owner/admin memberships', () => {
    const td = new Twoday('dev', { silent: true });
    return td.login()
      .then(() => td.getMemberships())
      .then(adminBlogs => {
        console.log('adminBlogs:', adminBlogs)
        expect(adminBlogs).toBeGreaterThan(0);
      })
  });
});
