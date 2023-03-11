const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod');
const alias = 'foundation';
const rnd = Math.floor(Math.random() * 99);
const imgName = `testimg${rnd.toString().padStart(2, '0')}`;

describe('Can work with Twoday images', () => {
  it('should retrieve a list of images', () => {
    return td
      .login()
      .then(() => td.listImages(alias))
      .then(images => {
        // console.log(images, images.length);
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

  it('should upload a local image with derived name', async () => {
    await td.login();
    const imgID = await td.createImage(alias, {
      path: path.resolve(process.cwd(), 'test/test.jpg'),
      alttext: 'Image with a derived name',
      resizeto: 'crop',
      width: '200',
      height: '112'
    });
    expect(imgID.startsWith('test')).toBeTruthy();
  });

  it('should upload a local image with a defined name', async () => {
    await td.login();
    const imgID = await td.createImage(alias, {
      alias: 'success_kid',
      path: path.resolve(process.cwd(), 'test/test.jpg'),
      alttext: 'Image with a predefined name',
      resizeto: 'crop',
      width: '800',
      height: '450'
    });
    expect(imgID.startsWith('success_kid')).toBeTruthy();
  });

  it('should upload a remote image by url', async () => {
    await td.login();
    const imgID = await td.createImage(alias, {
      url: 'http://enroute.square7.ch/blog/P1050700.JPG',
      alttext: 'P1050700 water jump',
      resizeto: 'no'
    });
    expect(imgID.startsWith('P1050700')).toBeTruthy();
  });

  it('should throw when neither path nor url was provided', async () => {
    await td.login();
    expect(() =>
      td.createImage(alias, {
        alias: 'test',
        alttext: 'No path no url test'
      })
    ).rejects.toThrow();
  });
});
