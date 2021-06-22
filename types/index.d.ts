type tPlatform = 'dev' | 'prod';

interface tUserOptions {
  delay?: number = 20;
  agreedVersion?: string = '20190210a';
  silent?: boolean = false;
}
interface tIsValidHoptype {
  valid: boolean;
  prototype: string;
  name: string;
}
interface tIsModifiedSkin extends tIsValidHoptype {
  isModified: boolean;
  url: string;
}
interface tModifiedSkin {
  name: string;
  url: string;
}
interface tSkin {
  name: string;
  url: string;
  secretKey?: string;
  action?: string;
  key?: string;
  skinset?: string;
  module?: string;
  title?: string;
  description?: string;
  skin?: string;
  save?: string;
}
interface tSkinOptions {
  title?: string;
  description?: string;
  skin?: string;
}

declare class Twoday {
  constructor(platform: tPlatform, userOptions?: tUserOptions);
  checkLoggedIn(): void;
  delayNextPromise(): void;
  #getDomain(): string;
  getAliasDomain(alias: string): string;
  #getSecretKey(data: string): string;
  fixURL(url: string): string;
  async login(): void;
  async getValidHoptypes(): string[];
  async isValidHoptype(skinName: string): tIsValidHoptype;
  async getMemberships(): string[];
  async getModifiedSkins(alias: string): tModifiedSkin;
  async isModifiedSkin(alias: string, skinName: string): tIsModifiedSkin;
  async getLayoutUrl(alias: string): string;
  async getSkin(skin: tSkin): tSkin;
  async postSkin(skin: tSkin): Response;
  #validateOptions(options: tSkinOptions): void;
  async updateSkin(alias: string, skinName: string, options: tSkinOptions): Response;
  async deleteSkin(alias: string, skinName: string): Response;
  async createSkin(alias: string, skinName: string, options?: tSkinOptions): Response;
}
