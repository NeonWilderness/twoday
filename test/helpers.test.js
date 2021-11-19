const Twoday = require('../src/index');
require('dotenv-safe').config();

jest.setTimeout(10000);
const td = new Twoday('prod');

describe('Provides working helper functions', () => {
  it('should return the correct alias blog url', () => {
    expect(td.getAliasDomain('info')).toBe('https://info.twoday.net');
    expect(td.getAliasDomain('neonwilderness')).toBe('https://neonwilderness.twoday.net');
    expect(() => td.getAliasDomain('')).toThrow();
    expect(() => td.getAliasDomain()).toThrow();
  });

  it('should fix incomplete URLs', () => {
    expect(td.fixURL('//static.twoday.net')).toBe('https://static.twoday.net');
    expect(td.fixURL('http://somedomain.com')).toBe('http://somedomain.com');
    expect(td.fixURL('ftp://somedomain.com')).toBe('ftp://somedomain.com');
  });

  it('should return all valid hoptypes', async () => {
    const hops = await td.getValidHoptypes();
    expect(Array.isArray(hops)).toBeTruthy();
    expect(hops.length).toBeGreaterThan(40);
  });

  it('should validate a hoptype', async () => {
    let result = await td.isValidHoptype('hopsy.display');
    expect(typeof result).toBe('object');
    expect(Object.keys(result)).toHaveLength(3);
    expect(result.valid).toBeFalsy();
    expect(result.prototype).toBe('hopsy');
    expect(result.name).toBe('display');
    result = await td.isValidHoptype('Site.page');
    expect(result.valid).toBeTruthy();
    expect(result.prototype).toBe('site');
    expect(result.name).toBe('page');
    result = await td.isValidHoptype('StOrY.editForm');
    expect(result.valid).toBeTruthy();
    expect(result.prototype).toBe('story');
    expect(result.name).toBe('editForm');
  });

  it('should throw when falsely calling listItems', async () => {
    await td.login();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    await td.listItems('neonwilderness', 'wrongResType');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
