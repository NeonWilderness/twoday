export type tPlatform = 'dev' | 'prod';
export type tResType = 'files' | 'images';

export interface tUserOptions {
  delay?: number;
  agreedVersion?: string;
  silent?: boolean;
}
export type tMemberType = 'Owner' | 'Administrator' | 'Contentmanager' | 'Contributor' | 'Subscriber';
export interface tMember {
  alias: string;
  role: tMemberType;
  url: string;
}
export interface tIsValidHoptype {
  valid: boolean;
  prototype: string;
  name: string;
}
export interface tIsModifiedSkin extends tIsValidHoptype {
  isModified: boolean;
  url: string;
}
export interface tNameUrl {
  name: string;
  url: string;
}
export interface tSkin {
  name: string;
  url: string;
}
export interface tSkinEnriched extends tSkin {
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
export interface tSkinOptions {
  title?: string;
  description?: string;
  skin?: string;
  diff?: boolean;
}
export interface tDiffResult {
  itemChanged: boolean;
  header: string;
  text: string;
  diffs: string;
}
export interface tDiffResults {
  skinChanged: boolean;
  results: tDiffResult[];
}
export interface tResourceInfo {
  name: string;
  mime: string;
  url: string;
}
export type tFileID = string;
export interface tFileInfo {
  name: string;
  path: string;
  description: string;
}
export type tImageID = string;
export type tResizeTo = 'max' | 'crop' | 'scale' | 'exact' | 'no';
export interface tImageInfo {
  alias?: string;
  path?: string;
  url?: string;
  alttext?: string;
  addToTopic?: string;
  topic?: string;
  resizeto?: tResizeTo;
  width?: string;
  height?: string;
}
export interface tLayoutInfo {
  name: string;
  path: string;
}
export interface tLayoutData {
  activeLayoutUrl: string;
  activeLayoutName: string;
  layoutNames: string[];
}
export type tStoryID = string | number;
export type tStoryAction = 'save' | 'publish';
export interface tStoryKeys {
  id: tStoryID;
  niceurl: string;
}
export interface tStoryInfo {
  title: string;
  body: string;
  id?: tStoryID;
  niceurl?: string;
  topic?: string;
  publish?: string;
  action?: tStoryAction;
}
export interface tStoryListItem {
  id: string;
  createDate: string;
  title: string;
}
export interface tStoryList {
  fromPage: number;
  toPage: number;
  maxPage: number;
  stories: tStoryListItem[];
  total: number;
}
export type tAlienVersion = string | 'N/A';
export interface tAliasInfo {
  creator: string;
  createDate: string;
  stories: number;
  comments: number;
  images: number;
  files: number;
  diskUsage: number;
  usedKB: number;
  trustedSite: boolean;
}

export declare class Twoday {
  constructor(platform: tPlatform, userOptions?: tUserOptions);
  #checkLoggedIn(): void;
  #getDomain(): string;
  #getSecretKey(data: string): string;
  login(): Promise<Response>;
  logout(): Promise<Response>;
  getMemberships(): Promise<string[]>;
  getMembers(): Promise<tMember[]>;
  // helper
  delayNextPromise(): Promise<void>;
  delayed(gotPromise: Promise): Promise<any>;
  fixURL(url: string): string;
  getAliasDomain(alias: string): string;
  getStaticUrl(alias: string, resType: tResType): string;
  getValidHoptypes(): Promise<string[]>;
  isValidHoptype(skinName: string): Promise<tIsValidHoptype>;
  listItems(alias: string, resType: tResType): Promise<tResourceInfo[]>;
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
  listFiles(alias: string): Promise<tResourceInfo[]>;
  hasFile(alias: string, fileName: string): Promise<boolean>;
  deleteFile(alias: string, fileName: string): Promise<Response>;
  createFile(alias: string, file: tFileInfo): Promise<tFileID>;
  updateFile(alias: string, file: tFileInfo): Promise<tFileID>;
  downloadFiles(alias: string, path: string): void;
  // images
  listImages(alias: string): Promise<tResourceInfo[]>;
  hasImage(alias: string, imgName: string): Promise<boolean>;
  deleteImage(alias: string, imgName: string): Promise<Response>;
  createImage(alias: string, image: tImageInfo): Promise<tImageID>;
  updateImage(alias: string, image: tImageInfo): Promise<tImageID>;
  downloadImages(alias: string, path: string): void;
  // stories
  getNiceUrl(url: string): string;
  listStories(alias: string, fromPage?: number, toPage?: number): Promise<tStoryList>;
  getStory(alias: string, id: string): Promise<Response> | null;
  hasStory(alias: string, id: string): Promise<boolean>;
  createStory(alias: string, story: tStoryInfo): Promise<tStoryKeys>;
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
