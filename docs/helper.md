
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Helper Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Returns promise after *delay* milliseconds (as specified in class constructor)
#### .delayNextPromise(): Promise&lt;void&gt;

- returns: void

> This delay function comes in handy in between of repetitive http calls to avoid hammering the server. The default waiting time is 100ms but may be modified by a constructor option.
<hr>

### Returns the appropriate platform blog url
#### .getAliasDomain(alias: string): string

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias

- returns: blog url as string

#### Example
```
const td = new Twoday.Twoday('prod');
const url = td.getAliasDomain('neonwilderness');
console.log(url); // https://neonwilderness.twoday.net
```
<hr>

### Returns the individual static url, if desired incl. a specific resource path
#### .getStaticUrl(alias: string, resType?: string)

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
resType? | string | 'images' or 'files'

- returns: the blog's static url as string

#### Example
```
const td = new Twoday.Twoday('prod');
const url1 = td.getStaticUrl('neonwilderness');
console.log(url1); // https://static.twoday.net/NeonWilderness/
const url2 = td.getStaticUrl('neonwilderness', 'images');
console.log(url2); // https://static.twoday.net/NeonWilderness/images/
```
<hr>

### Adds the https protocol to an URL when it is missing
#### .fixURL(url): string

Param | Type | Text
--- | --- | --- 
url | string | an abitrary (Twoday) URL

- returns: url complemented with https protocol as string

> Twoday utilizes schemeless URLs which sometimes raises issues with http node modules such as *got*. This helper function makes sure, the URL has a leading protocol.

#### Example
```
const td = new Twoday.Twoday('prod');
const url = td.fixURL('//static.twoday.net');
console.log(url); // https://static.twoday.net
```
<hr>

### Get all valid hoptypes from Twoday's Gitlab project site
#### .getValidHoptypes(): Promise&lt;string[]&gt;

- returns: array of strings (all valid Hoptypes)

> Valid Hoptypes are fetched from Twoday's Gitlab project site and are returned as a string array.

#### Example
```
const td = new Twoday.Twoday('prod');
const hops = await td.getValidHoptypes();
console.log(hops); // [bloggerapi, choice, comment, day, file, ... , topicmgr, user, vote]
```
<hr>

### Checks a skin qualifier and validates the hoptype
#### .isValidHoptype(skinName: string): Promise&lt;tIsValidHoptype&gt;

- returns: tIsValidHoptype object

tIsValidHoptype Property | Type | Text
--- | --- | --- 
valid | boolean | true=is a valid hoptype
prototype | string | prototype part of skinName, e.g. *Site*
name | string | name part of skinName, e.g. *page*

#### Example
```
const td = new Twoday.Twoday('prod');
const result = await td.isValidHoptype('hopsy.display');
console.log(result);
```

Example results in:
```
{
  valid: false,
  prototype: 'hopsy',
  name: 'display'
}
```
<hr>

### Get a list of files or images
#### .listItems(alias: string, resType: tResType) : Promise&lt;tResourceInfo[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias
resType | tResType | resource type: 'files' or 'images'

- requires: successful login
- returns: array of tResourceInfo

tResourceInfo Property | Type | Text
--- | --- | --- 
name | string | the resource's name
mime | string | the resource's mime type 
url | string | the resource's url

> Please also check the related [listFiles()](./docs/files.md#get-a-list-of-files) and [listImages()](./docs/images.md#get-a-list-of-images) functions. Both methods internally call *listItems()*.
