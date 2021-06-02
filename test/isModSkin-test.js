const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
const alias = 'neonwilderness';
dev.login()
  .then(() => dev.isModifiedSkin(alias, 'Site.page'))
  .then(result => {
    console.log('Testing Site.page');
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.prototype, 'site');
    assert.strictEqual(result.name, 'page');
    assert.strictEqual(result.isModified, true);
    return dev.isModifiedSkin(alias, 'Story.display');
  })
  .then(result => {
    console.log('Testing Story.display');
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.prototype, 'story');
    assert.strictEqual(result.name, 'display');
    assert.strictEqual(result.isModified, true);
    return dev.isModifiedSkin(alias, 'Site.notModified');
  })
  .then(result => {
    console.log('Testing Site.notModified');
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.prototype, 'site');
    assert.strictEqual(result.name, 'notModified');
    assert.strictEqual(result.isModified, false);
    console.log(chalk.green('isModSkin test successfully finished.'));
  });
