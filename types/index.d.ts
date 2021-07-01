type tPlatform = 'dev' | 'prod';

interface tUserOptions {
  delay?: number;
  agreedVersion?: string;
  silent?: boolean;
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
}
interface tSkinEnriched extends tSkin {
  secretKey: string;
  action: string;
  key: string;
  skinset: string;
  module: string;
  title: string;
  description: string;
  skin: string;
  save: string;
}
interface tSkinOptions {
  title?: string;
  description?: string;
  skin?: string;
}
interface tFileInfo {
  name: string;
  path: string;
  description: string;
}

declare class Twoday {
  constructor(platform: tPlatform, userOptions?: tUserOptions);
  checkLoggedIn(): void;
  delayNextPromise(): void;
  #getDomain(): string;
  getAliasDomain(alias: string): string;
  #getSecretKey(data: string): string;
  fixURL(url: string): string;
  login(): void;
  getValidHoptypes(): Promise<string[]>;
  isValidHoptype(skinName: string): Promise<tIsValidHoptype>;
  getMemberships(): Promise<string[]>;
  // skins
  getModifiedSkins(alias: string): Promise<tModifiedSkin>;
  isModifiedSkin(alias: string, skinName: string): Promise<tIsModifiedSkin>;
  getLayoutUrl(alias: string): Promise<string>;
  getSkin(skin: tSkin): Promise<tSkinEnriched>;
  postSkin(skin: tSkinEnriched): Promise<Response>;
  #validateOptions(options: tSkinOptions): void;
  updateSkin(alias: string, skinName: string, options: tSkinOptions): Promise<Response>;
  deleteSkin(alias: string, skinName: string): Promise<Response>;
  createSkin(alias: string, skinName: string, options?: tSkinOptions): Promise<Response>;
  // files
  listFiles(alias: string): Promise<string[]>;
  hasFile(alias: string, fileName: string): Promise<boolean>;
  deleteFile(alias: string, fileName: string): Promise<Response>;
  createFile(alias: string, file: tFileInfo): Promise<Response>;
  updateFile(alias: string, file: tFileInfo): Promise<Response>;
}
