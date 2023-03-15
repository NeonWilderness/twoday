const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday.Twoday('prod', { delay: 300 });
const alias = 'oman2010';

describe('Can provide a list of Twoday stories', () => {
  it('should compensate for undefined fromPage/toPage params', async () => {
    await td.login();
    const storyList = await td.listStories(alias);
    console.log(storyList);
    expect(storyList.fromPage).toBe(0);
    expect(storyList.maxPage).toBe(1);
    expect(storyList.toPage).toBe(storyList.maxPage);
    expect(storyList.total).toBe(storyList.stories.length);
  });

  it('should return only one story page on demand', async () => {
    await td.login();
    const storyList = await td.listStories(alias, 0, 0);
    expect(storyList.fromPage).toBe(0);
    expect(storyList.toPage).toBe(0);
    expect(storyList.maxPage).toBe(1);
    expect(storyList.total).toBe(27);
    expect(storyList.stories.length).toBe(20);
  });
});
