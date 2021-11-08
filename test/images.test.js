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
        // console.log(images, images.length);
        expect(Array.isArray(images)).toBeTruthy();
        expect(images.length).toBeGreaterThan(70);
        expect(typeof images[0]).toBe('object');
        const k = Object.keys(images[0]);
        expect(k).toHaveLength(3);
        expect(k).toContain('name');
        expect(k).toContain('mime');
        expect(k).toContain('url');
      });
  });
});
