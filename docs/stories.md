
[> Back to Topic Directory](../README.md#topic-related-class-functions)

## Stories Functions
### Introduction

> *Please be aware, that the code examples below are very condensed and intentionally omit the recommended try..catch construct as well as the async framing.*
<hr>

### Get a list of stories
#### .listStories(alias: string, fromPage: number = 0, toPage: number) : Promise&lt;tStoryList&gt;

Param | Type | Text
--- | --- | --- 
alias | string | a blog's alias

- requires: successful login
- returns: tStoryList object

tStoryList Property | Type | Text
--- | --- | --- 
fromPage | number | beginning page (starts with 0)
toPage | number | ending page
maxPage | number | number of available pages (each page holds up to 20 stories)
stories | tStoryListItem[] | array of *tStoryListItem*
total | number | number of total available stories for this alias

tStoryListItem Property | Type | Text
--- | --- | --- 
id | string | the story's id
createDate | string | date of creation as 'tt.mm.yyyy mm:dd'
title | string | the story's title

> *fromPage* defaults to 0 (most recent page = most recent 20 stories)

> *toPage* defaults to maxPage (if omitted, all stories of the blog will be returned)

> *toPage* must be greater or equal to *fromPage*

#### Example: List first 2 pages of most recent stories from blog alias 'neonwilderness'
```
const td = new Twoday.Twoday('prod', { delay: 100 });
await td.login();
const alias = 'neonwilderness';
const storyInfos = await td.listStories(alias, 0, 1);
console.log(storyInfos);
```
<hr>

### Reads a specific story from a blog alias
#### .getStory(alias: string, id: string): Promise&lt;Response&gt; | null

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
id | string | the story's id

- requires: successful login
- returns: res or null

#### Example: Read a certain story from the *foundation* blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const res = await td.getStory('foundation', '1022380953');
if (res) console.log(`The story text is: ${res.body}`);
```
<hr>

### Check if a specific story does exist on a blog alias
#### .hasStory(alias: string, id: string): Promise&lt;boolean&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
id | string | the story's id

- requires: successful login
- returns: boolean

#### Example: Check if a certain story exists on the *foundation* blog
```
const td = new Twoday.Twoday('prod');
await td.login();
const exists = await td.hasStory('foundation', '1022380953');
console.log(`The story does ${exists ? '' : 'not '}exist.`)
```
<hr>

### Create a new story
#### .createStory(alias: string, story: tStoryInfo): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
story | tStoryInfo | object

tStoryInfo Property | Type | Text
--- | --- | --- 
title | string | the story's title
body | string | the story's content
niceurl? | string | a nice url string
topic? | string | a topic string
publish? | string | datetimestamp as publish date of the story
action? | string | 'save' or 'publish'

- requires: successful login
- returns: tStoryKeys object 

tStoryKeys Property | Type | Text
--- | --- | --- 
id | string | the new story id
niceurl | string | the nice url string

> *title* and *body* are required parameters.

> If niceurl is null or undefined, the title will be converted to a nice url string.

> If the *publish* datetimestamp is a future date, the story will be publicly viewable from that date on. If *publish* is omitted, it will be replaced with the actual creation date.

> If *action* is null or undefined, action 'save' is assumed (story will be saved only but not published)

#### Example: Create a new story on blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod', { delay: 300 });
await td.login();
const story = { 
  title: 'The Falling Man',
  body: '<p>Lorem ipsum dolor sit amet, consetetur...</p><p>At vero eos et accusam et...</p>',
  topic: 'New York',
  action: 'publish'
};
const res = await td.createStory('neonwilderness', story);
console.log(`Story "${story.niceurl}" successfully created (code=${response.statusCode}).`);
```
<hr>

### Update a story
#### .updateStory(alias: string, story: tStoryInfo): Promise&lt;Response&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias
story | tStoryInfo | object

tStoryInfo Property | Type | Text
--- | --- | --- 
title | string | the story's title
body | string | the story's content
id | string | the story's id
niceurl? | string | a nice url string
topic? | string | a topic string
publish? | string | datetimestamp as publish date of the story
action? | string | 'save' or 'publish'

- requires: successful login
- returns: Response

> *title* and *body* are required parameters.

> If niceurl is null or undefined, the title will be converted to a nice url string.

> If the *publish* datetimestamp is a future date, the story will be publicly viewable from that date on. If *publish* is omitted, it will be replaced with the actual creation date.

> If *action* is null or undefined, action 'save' is assumed (story will be saved only but not published)

#### Example: Update a story on blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod', { delay: 300 });
await td.login();
const story = { 
  title: 'The 9/11 Jumpers',
  body: '<p>Lorem ipsum dolor sit amet, consetetur...</p><p>At vero eos et accusam et...</p>',
  id: '5185134',
  topic: 'New York'
};
const res = await td.updateStory('neonwilderness', story);
console.log(`Story "${story.id}" successfully updated (code=${response.statusCode}).`);
```
<hr>

### Get all topics being utilized in a blog/alias
#### .getStoryTopics(alias: string): Promise&lt;tNameUrl[]&gt;

Param | Type | Text
--- | --- | --- 
alias | string | the blog's alias

- returns: Array of tNameUrl

tNameUrl Property | Type | Text
--- | --- | --- 
name | string | topic text
url | string | url of the topic

#### Example: Read all utilized topics from blog alias *neonwilderness*
```
const td = new Twoday.Twoday('prod', { delay: 300 });
const data = await td.getStoryTopics('neonwilderness');
console.table(data); // lists: index, name, url
```
