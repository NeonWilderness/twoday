<div style="text-align:center;margin:20px auto">
  <img src="./docs/twoday.jpg" style="border:4px solid #5a6a3b;display:block" />
</div>

> This is a Node module to help interact with the most relevant functions of the **twoday.net** blogger platform

It helps you with
- reading/creating/updating/deleting skins
- listing/creating/updating/deleting files
- listing/creating/updating/deleting images
- listing/reading/creating/updating/deleting stories
- managing available layouts (e.g. add a skin to a non-active layout) or download a zipped layout file
- get general infos about a specific blog alias

## Installation
```
$ npm install @neonwilderness/twoday
```

## Twoday Credentials
For utilizing most of the API functions you will require a valid twoday.net User and Password which you need to specify in an **.env** file.

1. Copy the *.env.example* file into your Node project directory
2. Create an *.env* copy of the file and modify/save your Twoday credentials

## Definitions
Term | Meaning
--- | ---
Platform | "prod" or "dev" whereas **prod** is the production (end-user) platform and **dev** is the development/playground space for platform maintainers.
Alias | A blog alias is the name of a Twoday blog. Twoday blog urls are assembled as `https://{alias}.twoday.net`, e.g. in `https://neonwilderness.twoday.net`, "neonwilderness" is the blog alias.
Administrator | Crucial API functions such as updating skins or deleting files of an alias require **Administrator** authorization. The blog owner/creator is always an Administrator but may also appoint additional users to the "Adminstrator" role. Hence, you can only manage aliases (blogs) for which your specific user has been authorized as Admin or if you are its owner.
Skins | Twoday skins are template files which may contain HTML, CSS, JavaScript, partial layouts, miscelleaneous data and comprise the basis of the blog's frontend. They often embed macros such as `<% username %>` which are resolved/replaced server-side before sent to the browser.
Layouts | Each blog can have multiple layouts, yet only one of them is active and defines the look & feel of the blog. Layouts consist of a number of predefined (but editable) system skins or user defined skins.
Files | An alias can hold and upload own files, e.g. PDF, documents, script files, all kinds of data files to embed them either in stories or skins.
Images | An alias can store and upload images of different mime types which can then be used/embedded in stories with the `<% image name="..." %>` macro.
Stories | The blog's articles with data items such as title, createDate, content (HTML).

## Documentation
<hr>

### Class Constructor
#### new Twoday(platform: string, options: object)

Param | Type | Value/s
--- | --- | ---
platform | string | **prod** *or* **dev**
options | tUserOptions | object
<br>

tUserOptions Property | Type | Default | Text
--- | --- | --- | ---
delay? | number | 20 | Delay in ms between http calls
agreed? | string | '20190210a' | Current "Agreed terms of usage" version
silent? | boolean | false | Suppress console messages

> The options field may even be empty or completely omitted.

#### Example: Create a prod instance / no output messages
```
const Twoday = require('@neonwilderness/twoday');
const td = new Twoday('prod', { silent: true });
```
<hr>

### Login
#### .login() : Promise&lt;Response&gt;

- returns: http-response from login

#### Example: Create a prod instance with a general 50ms delay and login
```
const td = new Twoday('prod', { delay: 50 });
await td.login();
```
<hr>

### Logout
#### .logout() : Promise&lt;Response&gt;

- returns: http-response from logout

#### Example: Create a prod instance, login, get infos about an alias, then logout
```
const td = new Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const { stories } = await td.getInfos(alias);
console.log(`${alias} has written a total of ${stories} stories!`);
await td.logout();
```
> In principle, the final logout is non-essential, however it's a best practice to immediately clean up Twoday's sessions list.
<hr>

### Get all memberships with Administrator authorization
#### .getMemberships() : Promise&lt;string[]&gt;

- requires: successful login
- returns: array of aliases

> Blog owners (the creator of a blog) are also categorized as "Administrator".

> The user's authorization to access/modify a specific blog alias is always checked on the server side. To avoid authorization errors it hence makes sense to verify if the desired blog alias is included in the *getMemberships* response.

#### Example: Create prod instance, login, get all admin memberships
```
const td = new Twoday('prod');
await td.login();
const adminBlogs = await td.getMemberships();
console.log(`My user has ${adminBlogs.length} admin auths.`);
await td.logout();
```
<hr>

### Topic related class functions

Please refer to the following sub-pages for topic related documentation:

- [x] [Skins](./docs/skins.md) :: Functions related to Twoday Skins
- [x] [Stories](./docs/stories.md) :: Functions related to Twoday Stories
- [x] [Files](./docs/files.md) :: Functions related to Twoday Files
- [x] [Images](./docs/images.md) :: Functions related to Twoday Images
- [x] [Layouts](./docs/layouts.md) :: Functions related to Twoday Layouts
- [x] [Special](./docs/special.md) :: Special purpose functions
- [x] [Helper](./docs/helper.md) :: Useful helper functions
