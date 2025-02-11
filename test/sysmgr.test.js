const Twoday = require('../src/index');
require('dotenv-safe').config();
jest.setTimeout(10000);

describe('Can login and do sysmgr tasks', () => {
  it('should login and provide a user list for a user substring', () => {
    const td = new Twoday.Twoday('prod', { silent: true });
    return td
      .login()
      .then(() => td.getSysMgrUsers('neon'))
      .then(userlist => {
        console.log(userlist);
        expect(Array.isArray(userlist)).toBeTruthy();
        expect(userlist.length).toBeGreaterThan(20);
      });
  });
});
