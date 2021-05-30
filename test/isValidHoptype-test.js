const assert = require('assert').strict;
const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
dev.isValidHoptype('site.something')
  .then(result => {
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.prototype, 'site');
    assert.strictEqual(result.name, 'something');
    return dev.isValidHoptype('StOrY.newSkin');
  })
  .then(result => {
    assert.strictEqual(typeof result, 'object');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.prototype, 'story');
    assert.strictEqual(result.name, 'newSkin');
    return dev.isValidHoptype('xxx.wrongtype');
  })
  .then(result => {
    assert.strictEqual(result.valid, false);
    console.log(chalk.green('isValidHoptype test successfully finished.'));
  });
