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
    expect(td.delay).toBe(100);
    expect(td.silent).toBeFalsy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20240210a');
    expect(c.domain).toBe('twoday.net');
    expect(c.secure).toBeTruthy();
  });

  it('should work with platform=dev', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday-test.net');
    expect(td.baseUrl).toBe('https://twoday-test.net');
    expect(typeof td.layout).toBe('object');
    expect(Object.keys(td.layout)).toHaveLength(0);
    expect(td.delay).toBe(100);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20240210a');
    expect(c.domain).toBe('twoday-test.net');
    expect(c.secure).toBeTruthy();
  });

  it('should error with platform=xxx', () => {
    expect(() => new Twoday.Twoday('xxx')).toThrow(Error);
  });

  it('should consider platform=dev, delay=40, agreed=20210517b', () => {
    const td = new Twoday.Twoday('dev', { delay: 40, agreedVersion: '20210517b', silent: true });
    expect(td.platform).toBe('dev');
    expect(td.fullDomain).toBe('twoday-test.net');
    expect(typeof td.layout).toBe('object');
    expect(Object.keys(td.layout)).toHaveLength(0);
    expect(td.delay).toBe(40);
    expect(td.silent).toBeTruthy();
    const c = td.cookieJar.getCookiesSync(td.baseUrl)[0];
    expect(c.key).toBe('agreed');
    expect(c.value).toBe('20210517b');
    expect(c.domain).toBe('twoday-test.net');
    expect(c.secure).toBeTruthy();
  });

  it('should respect private methods', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(() => td.getDomain()).toThrow();
    expect(() => td.getSecretKey()).toThrow();
  });

  it('should get proper DEV alias domains', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday-test.net');
    expect(td.getAliasDomain('info')).toBe('https://info.twoday-test.net');
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
    const wantedUrl = `${td.getAliasDomain(alias)}/layouts/rainy`;
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

  it('should return the members', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    return td
      .login()
      .then(() => td.getMembers('mmm'))
      .then(members => {
        console.log(`Members: ${members.length}`);
        console.log(JSON.stringify(members, null, 2));
        expect(Array.isArray(members)).toBeTruthy();
        expect(members.length).toBeGreaterThan(0);
        for (let tMember of members) {
          const tMemberKeys = Object.keys(tMember);
          expect(tMemberKeys).toHaveLength(4);
          expect(tMemberKeys).toContain('alias');
          expect(tMemberKeys).toContain('role');
          expect(tMemberKeys).toContain('url');
          expect(tMemberKeys).toContain('member');
          expect(tMember.alias).toBeTruthy();
          expect(tMember.role).toMatch(/^(Owner|Administrator|Contentmanager|Contributor|Subscriber)/);
          if (tMember.member) expect(isNaN(tMember.member)).toBe(false);
        }
      });
  });
});
