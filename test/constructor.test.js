const Twoday = require('../src/index.js');
require('dotenv-safe').config();
jest.setTimeout(10000);

describe('Can instantiate a valid Twoday class', () => {
  it('should work with platform=prod', () => {
    const td = new Twoday.Twoday('prod');
    expect(td.platform).toBe('prod');
    expect(td.fullDomain).toBe('twoday.net');
    expect(td.baseUrl).toBe('https://twoday.net');
    expect(typeof td.layout).toBe('object');
    expect(Object.keys(td.layout)).toHaveLength(0);
    expect(td.delay).toBe(20);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20190210a');
    expect(c.domain).toBe('twoday.net');
    expect(c.secure).toBeTruthy();
  });

  it('should work with platform=dev', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday-test.click');
    expect(td.baseUrl).toBe('https://twoday-test.click');
    expect(typeof td.layout).toBe('object');
    expect(Object.keys(td.layout)).toHaveLength(0);
    expect(td.delay).toBe(20);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20190210a');
    expect(c.domain).toBe('twoday-test.click');
    expect(c.secure).toBeTruthy();
  });

  it('should error with platform=xxx', () => {
    expect(() => new Twoday.Twoday('xxx')).toThrow(Error);
  });

  it('should consider platform=dev, delay=40, agreed=20210517b', () => {
    const td = new Twoday.Twoday('dev', { delay: 40, agreedVersion: '20210517b', silent: true });
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday-test.click');
    expect(typeof td.layout).toBe('object');
    expect(Object.keys(td.layout)).toHaveLength(0);
    expect(td.delay).toBe(40);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20210517b');
    expect(c.domain).toBe('twoday-test.click');
    expect(c.secure).toBeTruthy();
  });

  it('should respect private methods', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(() => td.getDomain()).toThrow();
    expect(() => td.getSecretKey()).toThrow();
  });

  it('should get proper DEV alias domains', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday-test.click');
    expect(td.getAliasDomain('info')).toBe('https://info.twoday-test.click');
    expect(() => td.getAliasDomain('')).toThrow();
    expect(() => td.getAliasDomain()).toThrow();
  });

  it('should get proper PROD alias domains', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday.net');
    expect(td.getAliasDomain('info')).toBe('https://info.twoday.net');
    expect(() => td.getAliasDomain('')).toThrow();
    expect(() => td.getAliasDomain()).toThrow();
  });

  it('should save/return the layoutUrl of an alias', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    const alias = 'neonwilderness';
    const wantedUrl = 'https://neonwilderness.twoday.net/layouts/rainy';
    return td
      .login()
      .then(() => td.getLayout(alias))
      .then(({ activeLayoutUrl, activeLayoutName, layoutNames }) => {
        expect(activeLayoutUrl.length).toBeTruthy();
        expect(activeLayoutUrl).toBe(wantedUrl);
        expect(activeLayoutName.length).toBeTruthy();
        expect(activeLayoutName).toBe('rainy');
        expect(layoutNames.length).toBeGreaterThan(0);
        expect(Object.keys(td.layout)).toHaveLength(1);
        expect(alias in td.layout).toBeTruthy();
      });
  });

  it('should return the owner/admin memberships', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    return td
      .login()
      .then(() => td.getMemberships())
      .then(adminBlogs => {
        expect(Array.isArray(adminBlogs)).toBeTruthy();
        expect(adminBlogs.length).toBeGreaterThan(0);
      });
  });
});
