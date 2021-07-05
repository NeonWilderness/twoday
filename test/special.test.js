const fs = require('fs');
const path = require('path');
const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');

describe('Can work with Alien blogs', () => {
  it('should get the proper alien software version', async () => {
    let version = await td.checkUserAlienVersion('mmm');
    expect(version).not.toBe('N/A');
    version = await td.checkUserAlienVersion('cdn');
    expect(version).toBe('N/A');
  });
});
