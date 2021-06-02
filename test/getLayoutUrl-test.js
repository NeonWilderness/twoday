const chalk = require('chalk');
const Twoday = require('../src/index');
require('dotenv-safe').config();

const dev = new Twoday('dev');
const alias = 'neonwilderness';
dev
  .login()
  .then(() => dev.getLayoutUrl(alias))
  .then(url => {
    console.log(chalk.green(`getLayoutUrl returned "${url}"`)); 
  });
