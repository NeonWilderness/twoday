
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Layouts Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Switch to a specific layout (e.g. for subsequent skin calls)
#### .useLayout(alias: string, layoutName: string): Promise&lt;tLayoutData&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias
layoutName | string | a blog's existing layout name

- requires: successful login
- returns: tLayoutData object

tLayoutData Property | Type | Text
--- | --- | --- 
activeLayoutUrl | string | the active layout's URL
activeLayoutName | string | the name of the currently active layout
layoutNames | string[] | the names of all available layouts for this blog

#### Example: Switch to the alien layout of blog 'mmm' and log its URL
```
const td = new Twoday.Twoday('prod');
await td.login();
const data = await td.useLayout('mmm', 'alien');
console.log(`This alien layout's URL is "${data.activeLayoutUrl}"`);
```
<hr>

### Get the actual layout info
#### .getLayout(alias: string, refresh?: boolean): Promise&lt;tLayoutData&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias
refresh? | boolean | true=bypass cache and refresh the info (default=false)

- requires: successful login
- returns: tLayoutData object

tLayoutData Property | Type | Text
--- | --- | --- 
activeLayoutUrl | string | the active layout's URL
activeLayoutName | string | the name of the currently active layout
layoutNames | string[] | the names of all available layouts for this blog

#### Example: Log the active layout name of blog 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const data = await td.getLayout('neonwilderness');
console.log(`Neon's active layout name is "${data.activeLayoutName}"`);
```
<hr>

### Get the actual layout url
#### .getActiveLayoutUrl(alias: string): Promise&lt;string&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: layoutUrl as string

> This is a syntactic sugar function to the full info provider function *getLayout()*.

#### Example: Log the active layout url of blog 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const url = await td.getActiveLayoutUrl('neonwilderness');
console.log(`Neon's active layout url is "${url}"`);
```
<hr>

### Get the actual layout name
#### .getActiveLayoutName(alias: string): Promise&lt;string&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: layoutName as string

> This is a syntactic sugar function to the full info provider function *getLayout()*.

#### Example: Log the active layout name of blog 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const name = await td.getActiveLayoutName('neonwilderness');
console.log(`Neon's active layout name is "${name}"`);
```
<hr>

### Get all layout names of a blog
#### .getLayoutNames(alias: string): Promise&lt;string[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: array of layout names as string

> This is a syntactic sugar function to the full info provider function *getLayout()*.

#### Example: Log all layout names of blog 'neonwilderness'
```
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'neonwilderness';
const layouts = await td.getLayoutNames(alias);
console.log(The ${alias} blog features the following layouts: ${layouts.join(', ')}`);
```
<hr>

### Download a specific layout as a zipped file
#### .downloadLayout(alias: string, layout: tLayoutInfo): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias
layout | tLayoutInfo | object

tLayoutInfo Param | Type | Text
--- | --- | --- 
name | string | layout name to be downloaded
path | string | local path/location to store the target layout zip file 

- requires: successful login
- returns: http post response

> The downloaded layout is a zipped file embedding all modified skins of the specified layout name.

#### Example: Download the alien layout of blog 'mmm' as a zip-file
```
const path = require('path');
...
const td = new Twoday.Twoday('prod');
await td.login();
const alias = 'mmm';
const layout = 'alien';
await td.downloadLayout(alias, {
  name: layout,
  path: path.resolve(process.cwd(), `./data/${alias}-${layout}.zip`)
});
```