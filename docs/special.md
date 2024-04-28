
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Specialized Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Check the current layout's Alien tool version
#### .checkUserAlienVersion(alias: string): Promise&lt;tAlienVersion&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- returns: string (Alien tool version, e.g. '1.10.2' or 'N/A' if not existent)

> The Alien inside Twoday tool ("AIT") is a special layout (zip file), that allows Twoday bloggers to embed their external blog (e.g. Wordpress, Blogger, Custom, ...) within their old/former Twoday blog site. Utilization of the tool is limited and upon request only.

#### Example: Check/Log Alien tool version for all current Alien users

Please refer to [this Github script](https://github.com/NeonWilderness/tdalien/blob/master/utils/userStatus.js) for a comprehensive example using *checkUserAlienVersion()*.
<hr>

### Get basic infos about a blog
#### .getInfo(alias: string): Promise&lt;tAliasInfo&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias

- requires: successful login
- returns: tAliasInfo object

tAliasInfo Property | Type | Text
--- | --- | --- 
creator | string | the blog's creator
createDate | string | the datetime the blog was created
stories | number | the number of actual blog stories/articles
comments | number | the number of actual comments across all stories/articles
images | number | the number of uploaded blog images
files | number | the number of uploaded blog files
diskUsage | string | the percent figure of space usage, e.g. '73'
usedKB | number | the KB number of space used
trustedSite | boolean | true=this blog is classified as a trusted site

#### Example: Get basic infos about the neonwilderness blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const infos = await td.getInfos('neonwilderness');
console.log(infos);
```

Results in (as per 07.11.2021 ;):
```
{
  creator: 'NeonWilderness',     
  createDate: '24.10.2006 01:52',
  stories: 391,
  comments: 5774,
  images: 72,
  files: 5,
  diskUsage: 6.6,
  usedKB: 6758,
  trustedSite: false
}
```

### Get all members of a blog
#### .getMembers(alias: string): Promise&lt;tMember[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias

- requires: successful login
- returns: Array of tMember object

tMember Property | Type | Text
--- | --- | --- 
alias | string | the member's alias
role | string | the member's role, i.e. 'Owner', 'Administrator', 'Contentmanager', 'Contributor', 'Subscriber'
url | string | the member's url, e.g. blog url or mail adress; may be empty as well
member | string | the member's id number or empty string

#### Example: Get all members of the neonwilderness blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const members = await td.getMembers('neonwilderness');
console.log(JSON.stringify(members, null, 2));
```
