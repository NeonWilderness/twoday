
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Skin Functions
### Introduction

Twoday skins are organized in layouts. A blog can have multiple layouts, however only one layout is active at a time and is used to render the frontend.

All skin function calls will target the currently active layout. If you want to adress skins in a non-active layout, you <u>must</u> call the [useLayout() function](./docs/layouts.md#switch-to-a-specific-layout-eg-for-subsequent-skin-calls) before utilizing any subsequent skin functions!

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Get a list of modified skins
#### .getModifiedSkins(alias: string) : Promise&lt;tNameUrl[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: array of tNameUrl object

tNameUrl Property | Type | Text
--- | --- | --- 
name | string | skin qualifier, e.g. *Site.style*
url | string | url of the skin

#### Example: Create prod instance and log the list of modified skins of the 'mmm' blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const modSkins = await td.getModifiedSkins('mmm');
console.log('The following skins were modified:');
modSkins.forEach(skin => console.log(skin.name));
```
<hr>

### Check if a specific skin was modified
#### .isModifiedSkin(alias: string, skinName: string): Promise&lt;tIsModifiedSkin&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
skinName | string | a skin's qualifier, e.g. *Site.page*

- requires: successful login
- returns: tIsModifiedSkin object

tIsModifiedSkin Property | Type | Text
--- | --- | --- 
valid | boolean | true=is a valid hoptype
prototype | string | prototype part of skinName, e.g. *Site*
name | string | name part of skinName, e.g. *page*
isModified | boolean | true=this skin was modified
url | string | url of the skin


#### Example: Check if skin Site.page from the neonwilderness blog has been modified
```
const td = new Twoday.Twoday('prod');
await td.login();
const s = await td.isModifiedSkin('neonwilderness', 'site.page');
console.log(`Skin ${s.prototype}.${s.name} is ${s.isModified ? '' : 'not '}modified.`)
```
<hr>

### Get a specific skin (and related data)
#### .getSkin(skin: tSkin): Promise&lt;tSkinEnriched&gt;

getSkin() is a low-level function used by functions such as createSkin(), updateSkin() or deleteSkin().

tSkin Param | Type | Text
--- | --- | --- 
name | string | a skin's qualifier, e.g. site.page
url | string | url of the skin

- requires: successful login
- returns: tSkinEnriched object

tSkinEnriched Property | Type | Text
--- | --- | --- 
name | string | a skin's qualifier, e.g. site.page
url | string | url of the skin
secretKey | string | secretKey
action | string | action
key | string | key
skinset | string | skinset
module | string | module
title | string | the skin's title
description | string | the skin's description
skin | string | the skin's content
save | string | save


#### Example: Check if skin Story.display from the neonwilderness blog has been modified, then read it and log the skin's content
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const skinName = 'story.display';
const s = await td.isModifiedSkin(alias, skinName);
if (s.isModified) {
  const data = await td.getSkin({ name: skinName, url: s.url});
  console.log(data.skin);
};
```
<hr>

### Post a skin
#### .postSkin(skin: tSkinEnriched): Promise&lt;Response&gt;

postSkin() is a low-level function used by functions such as createSkin(), updateSkin() or deleteSkin().

tSkinEnriched Param | Type | Text
--- | --- | --- 
secretKey | string | secretKey
action | string | action
key | string | key
skinset | string | skinset
module | string | module
title | string | the skin's title
description | string | the skin's description
skin | string | the skin's content
save | string | save

- requires: successful login
- returns: http post response

#### Example: Get a skin and post it with a new title
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const skinName = 'story.display';
const s = await td.isModifiedSkin(alias, skinName);
const data = await td.getSkin({ name: skinName, url: s.url});
data.title = 'This is my new skin title!";
await td.postSkin(data);
```
<hr>

### Update a skin
#### .updateSkin(alias: string, skinName: string, options: tSkinOptions): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
skinName | string | the skin's qualifier, e.g. *Site.style*
options | tSkinOptions | object with optional skin fields

tSkinOptions Property | Type | Text
--- | --- | --- 
title? | string | a skin's new title
description? | string | a skin's new description
skin? | string | a skin's new content
diff? | boolean | true=log old/new differences

> Only the fields passed through tSkinOptions (i.e. title and/or description and/or skin) are updated. Other fields remain unchanged.

- requires: successful login
- returns: http post response

#### Example: Update the title of skin *Site.style* of blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod');
await td.login();
await td.updateSkin('neonwilderness', 'Site.style', {
  title: 'My special blog CSS'
});
```
<hr>

### Create a new skin
#### .createSkin(alias: string, skinName: string, options: tSkinOptions): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
skinName | string | the skin's qualifier, e.g. *Site.myNewSkin*
options | tSkinOptions | object with optional skin fields

tSkinOptions Property | Type | Text
--- | --- | --- 
title? | string | a skin's new title
description? | string | a skin's new description
skin? | string | a skin's new content

> tSkinOptions are optional. Non-defined fields will be saved with default values.

- requires: successful login
- returns: http post response

#### Example: Create a new skin *Site.myNewSkin* within *neonwilderness* alias
```
const td = new Twoday.Twoday('prod');
await td.login();
await td.createSkin('neonwilderness', 'Site.myNewSkin', {
  title: 'This is my new skin with a "Hello World" DIV',
  skin: '<div>Hello World</div>'
});
```
<hr>

### Delete a skin
#### .deleteSkin(alias: string, skinName: string): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
skinName | string | the skin's qualifier, e.g. *Site.obsolete*

- requires: successful login
- returns: http post response

> A skin will only be deleted if it is a modified standard skin or a custom skin!

#### Example: Delete skin *Site.obsolete* of blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod');
await td.login();
await td.deleteSkin('neonwilderness', 'Site.obsolete');
```
