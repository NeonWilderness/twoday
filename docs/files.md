
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Files Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Get a list of files
#### .listFiles(alias: string) : Promise&lt;tResourceInfo[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: array of tResourceInfo

tResourceInfo Property | Type | Text
--- | --- | --- 
name | string | the file's name
mime | string | the file's mime type 
url | string | the file's url

> This is a syntactic sugar function to the generic info provider function *[listItems()](./docs/helper.md#get-a-list-of-files-or-images)*.

#### Example: Log out all files of blog alias 'mmm'
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'mmm';
const resInfos = await td.listFiles(alias);
console.log(`Blog "${alias}" features the following files:`);
resInfos.forEach(file => console.log(file.name));
```
<hr>

### Check if a specific file does exist on a blog alias
#### .hasFile(alias: string, fileName: string): Promise&lt;boolean&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
fileName | string | a file name

- requires: successful login
- returns: boolean

#### Example: Check if file mySuperSong exists on the neonwilderness blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const hasSong = await td.hasFile('neonwilderness', 'mySuperSong');
console.log(`File mySuperSong does ${hasSong ? '' : 'not '}exist.`)
```
<hr>

### Update a file
#### .updateFile(alias: string, file: tFileInfo): Promise&lt;tFileID&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
file | tFileInfo | object

tFileInfo Property | Type | Text
--- | --- | --- 
name | string | the file's name
path | string | the file's location 
description | string | a textual file description

- requires: successful login
- returns: tFileID string

> If the file does not yet exist, it will be created.

#### Example: Update a minified JavaScript file *commentform-min* on blog alias *neonwilderness*
```
const path = require('path');
...
const td = new Twoday.Twoday('prod');
await td.login();
const fileID = await td.updateFile('neonwilderness', {
  name: 'commentform-min',
  path: path.resolve(process.cwd(), 'src/commentform-min.js'),
  description: 'Improved commentform script'
});
console.log(`The name tag for this file is: ${fileID}.`);
```
<hr>

### Create a file
#### .createFile(alias: string, file: tFileInfo): Promise&lt;tFileID&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
file | tFileInfo | object

tFileInfo Property | Type | Text
--- | --- | --- 
name | string | the file's name
path | string | the file's location 
description | string | a textual file description

- requires: successful login
- returns: tFileID string

> tFileID is the resulting name tag for the file, either defined by tFileInfo.name or derived by the system. If the same file name already exists, a new entry will be created and a sequential number will be added to tFileID (starting with "0"). It is strongly recommended to always check/use the returned tFileID as this may differ from the originally intended file name.

> If the file does already exist, a copy will be created.

#### Example: Create a JSON file with the name "version" on blog alias *neonwilderness*
```
const path = require('path');
...
const td = new Twoday.Twoday('prod');
await td.login();
const fileID = await td.createFile('neonwilderness', {
  name: 'version',
  path: path.resolve(process.cwd(), './version.json'),
  description: 'A JSON file that keeps the current script versions used on the blog.'
});
console.log(`The name tag for this file is: ${fileID}.`);
```
<hr>

### Delete a file
#### .deleteFile(alias: string, fileName: string): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
fileName | string | a file name

- requires: successful login
- returns: http post response

#### Example: Create a test JavaScript file and immediately delete it again
```
const path = require('path');
...
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const file = {
  name: 'test123',
  path: path.resolve(process.cwd(), './test123.js'),
  description: 'A test file that will quickly be deleted.'
};
const fileID = await td.createFile(alias, file);
await td.deleteFile(alias, fileID);
```

> You should not use *file.name* as a param to *td.deleteFile*, as the name tag may have been altered by the system (i.e. in case 'test123' already existed).
