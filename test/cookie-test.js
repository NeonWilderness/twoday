const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const td = new Twoday('dev');
td.login()
  .then(() => td.cookieJar.getCookiesSync(td.baseUrl))
  .then(cookies => {
    console.log(cookies);
    assert.strictEqual(cookies.length, 6);
    assert.strictEqual(cookies[2].key, 'avLoggedIn');
    assert.strictEqual(cookies[2].value, '1');
    assert.strictEqual(cookies[3].key, 'avType');
    assert.strictEqual(cookies[3].value, 'local');
    console.log(chalk.green('Cookie test successfully finished.'));
  })
  .catch(e => console.log(chalk.red('Error:', e)));
