const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');
const alias = 'neonwilderness';

describe('Can work with Twoday images', () => {
  it('should retrieve a list of images', () => {
    return td.login()
      .then(() => td.listImages(alias))
      .then(images => {
        console.log(images, images.length);
        expect(Array.isArray(images)).toBeTruthy();
        expect(images.length).toBeGreaterThan(70);
      });
  });
});
