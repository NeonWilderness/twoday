const cheerio = require('cheerio');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod');
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

  it('should get a story by numeric id', async () => {
    let res = await td.getStory(alias, '1022380953');
    expect(res).toBeTruthy();
    const $ = cheerio.load(res.body);
    expect($('.storyTitle>a').eq(0).text()).toBe('Bacon Ipsum Text');
    expect($('.storyContent>p').eq(0).text()).toMatch(/^Sausage kevin/);
  });

  it('should get a story by nice url', async () => {
    let res = await td.getStory(alias, 'baconipsum');
    expect(res).toBeTruthy();
    const $ = cheerio.load(res.body);
    expect($('.storyTitle>a').eq(0).text()).toBe('Bacon Ipsum Text');
    expect($('.storyContent>p').eq(0).text()).toMatch(/^Sausage kevin/);
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

  it('should return all story topics', async () => {
    await td.login();
    let result = await td.getStoryTopics(alias);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('News');
    expect(result[0].url).toBeTruthy();
    expect(result[1].name).toBe('Voting');
    expect(result[1].url).toBeTruthy();
  });  
});
