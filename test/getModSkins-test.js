const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
dev.login()
  .then(() => dev.getModifiedSkins('neonwilderness'))
  .then(skins => {
    assert.ok(Array.isArray(skins));
    assert.ok(skins.length > 0);
    let keys = Object.keys(skins[0]);
    assert.ok(keys.includes('url'));
    assert.ok(keys.includes('name'));
    console.log(skins);
    console.log(chalk.green('getModifiedSkins test finished.'));
  });
