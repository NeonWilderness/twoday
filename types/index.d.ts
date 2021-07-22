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
interface tNameUrl {
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
  diff?: boolean;
}
interface tDiffResult {
  itemChanged: boolean;
  header: string;
  text: string;
  diffs: string;
}
interface tDiffResults {
  skinChanged: boolean;
  results: tDiffResult[];
}
interface tFileInfo {
  name: string;
  path: string;
  description: string;
}
interface tLayoutInfo {
  name: string;
  path: string;
}
type tStoryID = string | number;
type tStoryAction = 'save' | 'publish';
interface tStoryInfo {
  title: string;
  body: string;
  id?: tStoryID;
  niceurl?: string;
  topic?: string;
  publish?: string;
  action?: tStoryAction;
}
type tAlienVersion = string | 'N/A';

declare class Twoday {
  constructor(platform: tPlatform, userOptions?: tUserOptions);
  checkLoggedIn(): void;
  delayNextPromise(): void;
  #getDomain(): string;
  getAliasDomain(alias: string): string;
  #getSecretKey(data: string): string;
  fixURL(url: string): string;
  login(): Promise<Response>;
  getValidHoptypes(): Promise<string[]>;
  isValidHoptype(skinName: string): Promise<tIsValidHoptype>;
  getMemberships(): Promise<string[]>;
  // skins
  getModifiedSkins(alias: string): Promise<tNameUrl[]>;
  isModifiedSkin(alias: string, skinName: string): Promise<tIsModifiedSkin>;
  getLayoutUrl(alias: string): Promise<string>;
  getSkin(skin: tSkin): Promise<tSkinEnriched>;
  postSkin(skin: tSkinEnriched): Promise<Response>;
  evalDiff(h: string, s1: string, s2: string): tDiffResult;
  diffSkin(skinName: string, skin1: tSkinOptions, skin2: tSkinOptions): tDiffResults;
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
  // stories
  hasStory(alias: string, id: string): Promise<boolean>;
  createStory(alias: string, story: tStoryInfo): Promise<Response>;
  updateStory(alias: string, story: tStoryInfo): Promise<Response>;
  getStoryTopics(alias: string): Promise<tNameUrl[]>;
  // layout
  downloadLayout(alias: string, layout: tLayoutInfo): Promise<Response>;
  // special
  checkUserAlienVersion(alias: string): Promise<tAlienVersion>;
}
