const Twoday = require('../src/index.js');

const td = new Twoday('prod', { silent: true });
describe('Can diff skins', () => {
  it('should throw an error upon wrong fields in skin param', () => {
    expect(() => td.diffSkin('Site.anything', { desc: ''}, {})).toThrow();
  });

  it('should diff title/description', () => {
    let skinChanged = td.diffSkin(
      'Site.something',
      { title: 'Something', description: 'This is a something skin' },
      { title: 'Something other', description: 'This is a something-other skin' }
    );
    expect(skinChanged).toBeTruthy();
  });

  it('should diff skin as equal', () => {
    let skinChanged = td.diffSkin(
      'Site.something',
      { skin: '<p>This is a paragraph</p>' },
      { skin: '<p>This is a paragraph</p>' }
    );
    expect(skinChanged).toBeFalsy();
  });

  it('should diff skin as unequal', () => {
    let skinChanged = td.diffSkin(
      'Site.something',
      { skin: '<p>This is unequal</p>' },
      { skin: '<p>This is a paragraph</p>' }
    );
    expect(skinChanged).toBeTruthy();
  });
});
