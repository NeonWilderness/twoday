const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('dev', { delay: 1000 });

describe('Consider delays between server hits', () => {
  it('should wait 1000ms between http calls', async () => {
    let start = new Date();
    await td.login();
    let diff = new Date() - start;
    console.info('Execution time Login: %dms', diff)
    expect(diff).toBeGreaterThan(1999); // Get/Post = 2*1000
    await td.logout();
    diff = new Date() - start - diff;
    console.info('Execution time Logout: %dms', diff)
    expect(diff).toBeGreaterThan(999);
  });
});
