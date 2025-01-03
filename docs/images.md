
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Images Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Get a list of images
#### .listImages(alias: string) : Promise&lt;tResourceInfo[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: array of tResourceInfo

tResourceInfo Property | Type | Text
--- | --- | --- 
name | string | the image's name
mime | string | the image's mime type 
url | string | the image's url

> This is a syntactic sugar function to the generic info provider function *[listItems()](./docs/helper.md#get-a-list-of-files-or-images)*.

#### Example: Log out all jpg images of blog alias 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const resInfos = await td.listImages(alias);
console.log(`Blog "${alias}" features the following jpg images:`);
console.log(resInfos.filter(img => img.mime === 'jpg'));
```
<hr>

### Check if a specific image does exist on a blog alias
#### .hasImage(alias: string, imgName: string): Promise&lt;boolean&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
imgName | string | a file name tag

- requires: successful login
- returns: boolean

#### Example: Check if image mySelfie exists on the neonwilderness blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const hasSelfie = await td.hasImage('neonwilderness', 'mySelfie');
console.log(`File mySelfie does ${hasSelfie ? '' : 'not '}exist.`)
```
<hr>

### Update an image
#### .updateImage(alias: string, image: tImageInfo): Promise&lt;tImageID&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
image | tImageInfo | object

tImageInfo Property | Type | Text
--- | --- | --- 
alias? | string | the image's name
path? | string | the image's location
url? | string | an image url
resizeto? | tResizeTo | 'max', 'crop', 'scale', 'exact' or 'no'
width? | string | target width (used if resizeto !== 'no')
height? | string | target height (used if resizeto !== 'no')

- requires: successful login
- returns: tImageID string (alias)

> Defaults are resizeto='no' and width/height=400.

#### Example: Update an image 'baum1' on blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod');
await td.login();
const data = { 
  alias: 'baum1',
  url: 'https://myimages.domain.com/baum3.jpg',
  resizeto: 'crop',
  width: '800',
  height: '450'
}
const imgID = await td.updateImage('neonwilderness', data);
console.log(`Image ID "${imgID}" successfully replaced!`);
```
<hr>

### Create a new image
#### .createImage(alias: string, image: tImageInfo): Promise&lt;tImageID&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
image | tImageInfo | object

tImageInfo Property | Type | Text
--- | --- | --- 
alias? | string | the image's name
path? | string | the image's location
url? | string | an image url
alttext? | string | an image description (also used for ALT="...")
resizeto? | tResizeTo | 'max', 'crop', 'scale', 'exact' or 'no'
addToTopic? | string | add image to an existing photo album
topic? | string | name of a new photo album
width? | string | target width (used if resizeto !== 'no')
height? | string | target height (used if resizeto !== 'no')
layout? | string | an existing layout name of this alias

- requires: successful login
- returns: tImageID string (alias)

> Defaults are resizeto='no' and width/height=400.

> tImageID is the resulting name tag for the image, either defined by tImageInfo.alias or derived by the system. If the same image name already exists, a new entry will be created and a sequential number will be added to tImageID (starting with "0"). It is strongly recommended to always check/use the returned tImageID as this may differ from the originally intended image name.

> If the image does already exist, a copy will be created.

> If param "layout" is passed, the image will instead be added to this layout as a layout image. When creating a layout image, the params "topic" and "addToTopic" will be ignored.

> Refer to the *getActiveLayoutName* API call to get the name of the active layout. Check *getLayoutNames* to get a list of all existing layout names on a blog.

#### Example: Create a new image with the name "baum2" on blog alias *neonwilderness* as part of photo album "My tree images"
```
const td = new Twoday.Twoday('prod');
await td.login();
const data = { 
  alias: 'baum2',
  url: 'https://myimages.domain.com/baum2.jpg',
  topic: 'My tree images'
};
const imgID = await td.createImage('neonwilderness', data);
console.log(`Image ID "${imgID}" successfully created!`);
```

#### Example: Create a new layout image with the target name "bg" in blog alias *recycle* within its layout name *default*
```
const td = new Twoday.Twoday('prod');
await td.login();
const data = { 
  alias: 'bg',
  path: path.resolve(process.cwd(), 'local/bg.jpg'),
  layout: 'default'
};
await td.createImage('recycle', data);
console.log(`Layout Image ID "${data.alias}" successfully created!`);
```
<hr>

### Delete an image
#### .deleteImage(alias: string, imgName: string): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
imgName | string | an image name tag

- requires: successful login
- returns: http post response

#### Example: Delete an image ID 'baum3' on blog 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
await td.deleteImage(alias, 'baum3');
```
