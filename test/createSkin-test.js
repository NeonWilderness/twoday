const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
const alias = 'neonwilderness';
const skin = 'Site.something';
dev
  .login()
  .then(() => dev.createSkin(alias, skin))
  .then(() => dev.isModifiedSkin(alias, skin))
  .then(result => {
    console.log(chalk.blue(`Skin "${skin}" ${result.isModified ? 'created' : 'not found'}.`)); 
    console.log(chalk.green('createSkin test finished.')); 
  });
