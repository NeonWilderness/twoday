const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('dev', { silent: true });
const alias = 'neonwilderness';

describe('Can work with Twoday skins', () => {
  it.skip('should throw when login is missing', () => {
    return expect(() => td.getModifiedSkins(alias)).rejects.toThrow();
  });

  it.skip('should return a modified skins array', () => {
    return td
      .login()
      .then(() => td.getModifiedSkins(alias))
      .then(skins => {
        expect(Array.isArray(skins)).toBeTruthy();
        expect(skins.length).toBeTruthy();
        let keys = Object.keys(skins[0]);
        expect(keys).toHaveLength(2);
        expect(keys).toContain('url');
        expect(keys).toContain('name');
      });
  });

  it.skip('should detect a modified skin', () => {
    return td
      .login()
      .then(() => td.isModifiedSkin(alias, 'Site.page'))
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('isModified', true);
        expect(result).toHaveProperty('valid', true);
        expect(result).toHaveProperty('prototype', 'site');
        expect(result).toHaveProperty('name', 'page');
      });
  });

  it.skip('should detect an unmodified skin', () => {
    return td
      .login()
      .then(() => td.isModifiedSkin(alias, 'Story.notModified'))
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('isModified', false);
        expect(result).toHaveProperty('valid', true);
        expect(result).toHaveProperty('prototype', 'story');
        expect(result).toHaveProperty('name', 'notModified');
      });
  });

  it.skip('should detect a valid hoptype', () => {
    return td.isValidHoptype('site.something')
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('valid', true);
        expect(result).toHaveProperty('prototype', 'site');
        expect(result).toHaveProperty('name', 'something');
      });
  });

  it.skip('should understand an uppercase hoptype', () => {
    return td.isValidHoptype('StOrY.display')
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('valid', true);
        expect(result).toHaveProperty('prototype', 'story');
        expect(result).toHaveProperty('name', 'display');
      });
  });

  it.skip('should detect an invalid hoptype', () => {
    return td.isValidHoptype('xxx.wrongHopType')
      .then(result => {
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('valid', false);
        expect(result).toHaveProperty('prototype', 'xxx');
        expect(result).toHaveProperty('name', 'wrongHopType');
      });
  });

  it.skip('should return skin data via GET', () => {
    return td.login()
      .then(() => td.getModifiedSkins('neonwilderness'))
      .then(skins => td.getSkin(skins[skins.length - 1]))
      .then(data => {
        expect(typeof data).toBe('object');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('url');
        expect(data).toHaveProperty('secretKey');
        expect(data).toHaveProperty('action');
        expect(data).toHaveProperty('key');
        expect(data).toHaveProperty('skinset');
        expect(data).toHaveProperty('module');
        expect(data).toHaveProperty('title');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('skin');
        expect(data).toHaveProperty('save');
      });
  });

  it.skip('should create and delete a new skin', () => {
    const rnd = Math.floor(Math.random() * 20);
    const skin = `Site.something${rnd.toString().padStart(2,'0')}`;
    return td.login()
      .then(() => td.createSkin(alias, skin))
      .then(() => td.isModifiedSkin(alias, skin))
      .then(result => td.getSkin({
        name: result.name,
        url: result.url
      }))
      .then(data => {
        expect(data.title).toContain(skin);
        expect(data.description).toContain(skin);
        expect(data.skin).toContain(skin);
        return td.deleteSkin(alias, skin);
      })
      .then(() => td.isModifiedSkin(alias, skin))
      .then(result => expect(result.isModified).toBeFalsy())
  });

  it('should update and log diff an existing skin', () => {
    const skinName = 'Site.something08';
    return td.login()
      .then(() => td.updateSkin(alias, skinName, {
        description: 'This is an updated test skin used by the twoday npm module.',
        skin: '<div>An updated version is here.</div>',
        diff: true
      }))
  });
});
