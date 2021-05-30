const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
dev
  .login()
  .then(() => dev.getModifiedSkins('neonwilderness'))
  .then(skins => dev.getSkin(skins[skins.length - 1]))
  .then(skin => {
    console.log(skin);
    assert.ok(typeof skin === 'object');
    let keys = Object.keys(skin);
    assert.ok(keys.includes('name'));
    assert.ok(keys.includes('url'));
    assert.ok(keys.includes('secretKey'));
    assert.ok(keys.includes('action'));
    assert.ok(keys.includes('key'));
    assert.ok(keys.includes('skinset'));
    assert.ok(keys.includes('module'));
    assert.ok(keys.includes('title'));
    assert.ok(keys.includes('description'));
    assert.ok(keys.includes('content'));
    assert.ok(keys.includes('save'));
    console.log(chalk.green('getSkin test finished.'));
  });
