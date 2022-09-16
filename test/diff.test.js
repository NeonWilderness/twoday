const Twoday = require('../src/index.js');

const td = new Twoday('prod', { silent: true });
describe('Can diff skins', () => {
  it('should throw an error upon wrong fields in skin param', () => {
    expect(() => td.diffSkin('Site.anything', { desc: '' }, {})).toThrow();
  });

  it('should diff title/description', () => {
    let diff = td.diffSkin(
      'Site.something',
      { title: 'Something', description: 'This is a something skin' },
      { title: 'Somewhat other', description: 'This is a somewhat other skin' }
    );
    expect(diff.skinChanged).toBeTruthy();
  });

  it('should diff skin as equal', () => {
    let diff = td.diffSkin(
      'Site.something',
      { skin: '<p>This is a paragraph</p>' },
      { skin: '<p>This is a paragraph</p>' }
    );
    expect(diff.skinChanged).toBeFalsy();
  });

  it('should diff skin as unequal', () => {
    let diff = td.diffSkin(
      'Site.something',
      { skin: '<p>This is unequal</p>' },
      { skin: '<p>This is a paragraph</p>' }
    );
    expect(diff.skinChanged).toBeTruthy();
  });
});
