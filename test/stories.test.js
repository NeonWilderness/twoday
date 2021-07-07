const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');
const alias = 'foundation';

describe('Can work with Twoday stories', () => {
  it('should create a new story as unpublished', async () => {
    const rnd = Math.floor(Math.random() * 99);
    const story = {
      title: `Title No.${rnd.toString().padStart(2, '0')}`,
      body: '<p>something</p>'
    };
    await td.login();
    return await td.createStory(alias, story);
  });

  it('should update/publish a story by id', async () => {
    const story = {
      title: `Title No.11`,
      id: 1022684884,
      body: '<p>updated body</p>',
      action: 'publish'
    };
    await td.login();
    return await td.updateStory(alias, story);
  });

  it('should unpublish a published story', async () => {
    const story = {
      title: `Title No.11`,
      id: 1022684884,
      action: 'save'
    };
    await td.login();
    return await td.updateStory(alias, story);
  });

  it('should check if a story exists', async () => {
    await td.login();
    let result = await td.hasStory(alias, 'faktortable');
    expect(result).toBeTruthy();
    result = await td.hasStory(alias, '1022683664');
    expect(result).toBeTruthy();
    result = await td.hasStory(alias, 'nonexistentstory');
    expect(result).toBeFalsy();
  });
});