const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const loginPromise = platform => {
  const td = new Twoday(platform);
  return td.login().then(() => {
    const c = td.cookieJar.getCookiesSync(td.baseUrl);
    console.log(c);
    assert.strictEqual(c.length, 6);
    assert.strictEqual(c[0].key, 'agreed');
    assert.strictEqual(c[1].key, 'HopSession');
    assert.strictEqual(c[2].key, 'avLoggedIn');
    assert.strictEqual(c[2].value, '1');
    assert.strictEqual(c[3].key, 'avType');
    assert.strictEqual(c[4].key, 'avUsr');
    assert.strictEqual(c[5].key, 'avPw');
    console.log(chalk.green(`Login @ ${platform} test finished.\n`));
  });
};

loginPromise('prod').then(() => loginPromise('dev'));
