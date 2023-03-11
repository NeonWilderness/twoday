const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod');
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

  it('should check file existence', () => {
    return td.login()
      .then(() => td.hasFile(alias, 'eugene'))
      .then(exists => {
        expect(exists).toBeTruthy();
        return td.hasFile(alias, 'nonexistentfile');
      })
      .then(exists => expect(exists).toBeFalsy());
  });

  it('should retrieve a list of files', () => {
    return td.login()
      .then(() => td.listFiles(alias))
      .then(files => {
        // console.log(files);
        expect(Array.isArray(files)).toBeTruthy();
        expect(files.length).toBeGreaterThan(60);
        expect(typeof files[0]).toBe('object');
        const k = Object.keys(files[0]);
        expect(k).toHaveLength(3);
        expect(k).toContain('name');
        expect(k).toContain('mime');
        expect(k).toContain('url');

      });
  });
});
