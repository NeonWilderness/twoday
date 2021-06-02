const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
const alias = 'neonwilderness';
const skin = 'Site.something';
dev
  .login()
  .then(() => dev.deleteSkin(alias, skin))
  .then(() => dev.isModifiedSkin(alias, skin))
  .then(result => {
    console.log(chalk.blue(`Confirmed: Skin "${skin}" ${result.isModified ? 'still there' : 'was deleted'}.`)); 
    console.log(chalk.green('deleteSkin test finished.')); 
  });
