const path = require('node:path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(20000);
const td = new Twoday.Twoday('prod');
const alias = 'foundation';

describe('Can work with Twoday images', () => {
  beforeAll(async () => {
    await td.login({ silent: true });
    // delete all test images
    const images = await td.listImages(alias);
    for (const image of images) {
      if (!image.name.startsWith('test')) continue;
      await td.deleteImage(alias, image.name);
    }
  });

  afterAll(async () => {
    await td.logout();
  });

  it('should retrieve a list of images', () => {
    return td.listImages(alias).then(images => {
      console.log(images, images.length);
      expect(Array.isArray(images)).toBeTruthy();
      expect(images.length).toBeGreaterThan(2);
      expect(typeof images[0]).toBe('object');
      const k = Object.keys(images[0]);
      expect(k).toHaveLength(3);
      expect(k).toContain('name');
      expect(k).toContain('mime');
      expect(k).toContain('url');
    });
  });

  it('should retrieve a list of layout images', () => {
    return td.listImages(alias, 'twoday30').then(images => {
      console.log(images, images.length);
      expect(Array.isArray(images)).toBeTruthy();
      expect(images.length).toBeGreaterThan(0);
      expect(typeof images[0]).toBe('object');
      const k = Object.keys(images[0]);
      expect(k).toHaveLength(3);
      expect(k).toContain('name');
      expect(k).toContain('mime');
      expect(k).toContain('url');
    });
  });

  xit('should upload a local image with derived name "test"', async () => {
    const imgID = await td.createImage(alias, {
      path: path.resolve(process.cwd(), 'test/test.jpg'),
      alttext: 'Image with a derived name',
      resizeto: 'crop',
      width: '200',
      height: '112'
    });
    expect(imgID.startsWith('test')).toBeTruthy();
  });

  xit('should upload a local image with a defined name "test02"', async () => {
    const imgID = await td.createImage(alias, {
      alias: 'test02',
      path: path.resolve(process.cwd(), 'test/test.jpg'),
      alttext: 'Image with a predefined name',
      resizeto: 'crop',
      width: '800',
      height: '450'
    });
    expect(imgID.startsWith('test02')).toBeTruthy();
  });

  xit('should upload a remote image by url', async () => {
    const imgID = await td.createImage(alias, {
      alias: 'test03',
      url: 'https://static.twoday.net/www/layouts/twoday30/header_logo.jpg',
      alttext: 'td_header_logo',
      resizeto: 'no'
    });
    expect(imgID.startsWith('test03')).toBeTruthy();
  });

  xit('should upload a layout image', async () => {
    const imgID = await td.createImage(alias, {
      alias: 'test04',
      path: path.resolve(process.cwd(), 'test/test.jpg'),
      alttext: 'Image with a predefined name',
      resizeto: 'crop',
      width: '800',
      height: '450',
      layout: 'twoday30'
    });
    expect(imgID.startsWith('kid')).toBeTruthy();
  });

  xit('should throw when neither path nor url was provided', async () => {
    expect(() =>
      td.createImage(alias, {
        alias: 'test',
        alttext: 'No path no url test'
      })
    ).rejects.toThrow();
  });
});
