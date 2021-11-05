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
interface tLayoutData {
  activeLayoutUrl: string;
  activeLayoutName: string;
  layoutNames: string[];
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
interface tStoryListItem {
  id: string;
  createDate: string;
  title: string;
}
interface tStoryList {
  fromPage: number;
  toPage: number;
  maxPage: number;
  stories: tStoryListItem[];
  total: number;
}
type tAlienVersion = string | 'N/A';
interface tAliasInfo {
  creator: string,
  createDate: string,
  stories: number,
  comments: number,
  images: number,
  files: number,
  diskUsage: string,
  usedKB: number,
  trustedSite: boolean
}

declare class Twoday {
  constructor(platform: tPlatform, userOptions?: tUserOptions);
  checkLoggedIn(): void;
  delayNextPromise(): void;
  #getDomain(): string;
  getAliasDomain(alias: string): string;
  #getSecretKey(data: string): string;
  fixURL(url: string): string;
  login(): Promise<Response>;
  logout(): Promise<Response>;
  getValidHoptypes(): Promise<string[]>;
  isValidHoptype(skinName: string): Promise<tIsValidHoptype>;
  getMemberships(): Promise<string[]>;
  // skins
  getModifiedSkins(alias: string): Promise<tNameUrl[]>;
  isModifiedSkin(alias: string, skinName: string): Promise<tIsModifiedSkin>;
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
  listStories(alias: string, fromPage?: number, toPage?: number): Promise<tStoryList[]>;
  getStory(alias: string, id: string): Promise<Response> | null;
  hasStory(alias: string, id: string): Promise<boolean>;
  createStory(alias: string, story: tStoryInfo): Promise<Response>;
  updateStory(alias: string, story: tStoryInfo): Promise<Response>;
  getStoryTopics(alias: string): Promise<tNameUrl[]>;
  // layout
  #getLayoutData(alias: string): Promise<tLayoutData>;
  getLayout(alias: string, refresh?: boolean): Promise<tLayoutData>;
  getActiveLayoutUrl(alias: string): Promise<string>;
  getActiveLayoutName(alias: string): Promise<string>;
  getLayoutNames(alias: string): Promise<string[]>;
  useLayout(alias: string, layoutName: string): Promise<tLayoutData>;
  downloadLayout(alias: string, layout: tLayoutInfo): Promise<Response>;
  // special
  checkUserAlienVersion(alias: string): Promise<tAlienVersion>;
  getInfo(alias: string): Promise<tAliasInfo>;
}
