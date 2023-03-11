const Twoday = require('../src/index');
require('dotenv-safe').config();
jest.setTimeout(10000);

describe('Can login and receive/store all necessary cookies', () => {
  it('should login to dev and get/store the relevant cookies', () => {
    const td = new Twoday.Twoday('dev', { silent: true });
    return td
      .login()
      .then(() => td.cookieJar.getCookiesSync(td.baseUrl))
      .then(cookies => {
        expect(cookies).toHaveLength(6);
        expect(cookies[0].key).toBe('agreed');
        expect(cookies[1].key).toBe('HopSession');
        expect(cookies[2].key).toBe('avLoggedIn');
        expect(cookies[2].value).toBe('1');
        expect(cookies[3].key).toBe('avType');
        expect(cookies[4].key).toBe('avUsr');
        expect(cookies[5].key).toBe('avPw');
      });
  });

  it('should login to prod and get/store the relevant cookies', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    return td
      .login()
      .then(() => td.cookieJar.getCookiesSync(td.baseUrl))
      .then(cookies => {
        expect(cookies).toHaveLength(6);
        expect(cookies[0].key).toBe('agreed');
        expect(cookies[1].key).toBe('HopSession');
        expect(cookies[2].key).toBe('avLoggedIn');
        expect(cookies[2].value).toBe('1');
        expect(cookies[3].key).toBe('avType');
        expect(cookies[4].key).toBe('avUsr');
        expect(cookies[5].key).toBe('avPw');
      });
  });
});
