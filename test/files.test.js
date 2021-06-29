const fs = require('fs');
const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');
const alias = 'cdn';

describe('Can work with Twoday files', () => {
  it('should create a new file entry', () => {
    const rnd = Math.floor(Math.random() * 99);
    const file = {
      name: `testfile${rnd.toString().padStart(2, '0')}`,
      path: path.resolve(process.cwd(), 'src/index.js'),
      description: 'JavaScript File Create Test'
    };
    return td.login().then(() => td.createFile(alias, file));
  });

  it('should delete a newly created file', () => {
    const file = {
      name: `deletefiletest`,
      path: path.resolve(process.cwd(), 'src/index.js'),
      description: 'JavaScript File Delete Test'
    };
    return td.login()
      .then(() => td.createFile(alias, file))
      .then(() => td.deleteFile(alias, file.name));
  });
});
