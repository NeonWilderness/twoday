const Twoday = require('./index.js');
require('dotenv-safe').config();

describe('Can instantiate a valid Twoday class', () => {
  it('should work with platform=prod', () => {
    const td = new Twoday('prod');
    expect(td.platform).toEqual('prod');
    expect(td.fullDomain).toEqual('twoday.net');
    expect(td.layoutUrl.length).toEqual(0);
    expect(td.delay).toEqual(20);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toEqual('agreed');
    expect(c.value).toEqual('20190210a');
    expect(c.domain).toEqual('twoday.net');
    expect(c.secure).toBeTruthy();
  });

  it('should work with platform=dev', () => {
    const td = new Twoday('dev');
    expect(td.platform).toEqual('dev');
    expect(td.fullDomain).toEqual('twoday.xyz');
    expect(td.layoutUrl.length).toEqual(0);
    expect(td.delay).toEqual(20);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toEqual('agreed');
    expect(c.value).toEqual('20190210a');
    expect(c.domain).toEqual('twoday.xyz');
    expect(c.secure).toBeTruthy();
  });

  it('should error with platform=xxx', () => {
    expect(() => new Twoday('xxx')).toThrow(Error);
  });

  it('should consider platform=dev, delay=40, agreed=20210517b', () => {
    const td = new Twoday('dev', { delay: 40, agreedVersion: '20210517b', silent: true });
    expect(td.platform).toEqual('dev');
    expect(td.fullDomain).toEqual('twoday.xyz');
    expect(td.layoutUrl.length).toEqual(0);
    expect(td.delay).toEqual(40);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toEqual('agreed');
    expect(c.value).toEqual('20210517b');
    expect(c.domain).toEqual('twoday.xyz');
    expect(c.secure).toBeTruthy();
  });

  it('should respect private methods', () => {
    const td = new Twoday('dev');
    expect(() => td.getDomain()).toThrow();
    expect(() => td.getSecretKey()).toThrow();
  });

  it('should get proper DEV alias domains', () => {
    const td = new Twoday('dev');
    expect(td.getAliasDomain('neonwilderness')).toEqual('https://neonwilderness.twoday.xyz');
    expect(td.getAliasDomain('info')).toEqual('https://info.twoday.xyz');
  });

  it('should get proper PROD alias domains', () => {
    const td = new Twoday('prod');
    expect(td.getAliasDomain('neonwilderness')).toEqual('https://neonwilderness.twoday.net');
    expect(td.getAliasDomain('info')).toEqual('https://info.twoday.net');
  });

  it('should get the layoutUrl of an alias', () => {
    const td = new Twoday('dev', { silent: true });
    return td.login()
      .then(() => td.getLayoutUrl('neonwilderness'))
      .then(url => {
        expect(url.length).toBeTruthy();
        expect(url).toEqual('https://neonwilderness.twoday.xyz/layouts/rainy');
      })
  });
});
