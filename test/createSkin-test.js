const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
const alias = 'neonwilderness';
dev
  .login()
  .then(() => dev.createSkin(alias, 'Site.something'))
  .then(() => console.log(chalk.green('createSkin test finished.')));
