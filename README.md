# json-meta-marked
Convert markdown with json front matter to json object with metadata &amp; html.  
Works in both directions.  
Works as `cli` and `required module`

## USAGE - When `required module` -- markdown2json

### [jsonfront.md]

```markdown
---
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ]
}
---

# Metadata of content
```
### [markdown2json.js]

```js
var jsm = require('json-meta-marked');
var fs  = require('fs');
var obj = jsm.parse(fs.readFileSync('jsonfront.md'));
console.log(JSON.stringify(obj, null, 2));

```
#### `$> node markdown2json.js`

```bash
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ],
  "__content__": "<h1 id=\"metadata-of-content\">Metadata of content</h1>"
}
```
## USAGE - When `required module` -- json2markdown

### [htmlified.json]
```bash
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ],
  "__content__": "<h1 id=\"metadata-of-content\">Metadata of content</h1>"
}
```
### [json2markdown.js]

```js
var jsm = require('json-meta-marked');
var fs  = require('fs');
var obj = JSON.parse(fs.readFileSync('htmlified.json'));
console.log(jsm.serialize(obj));
```
#### `$> node json2markdown.js`

```markdown
---
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ]
}
---

# Metadata of content
```

## USAGE - From `cli` - markdown2json

### [jsonfront.md]

```markdown
---
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ]
}
---

# Metadata of content
```
### cli:

`$> node install -g json-meta-marked`
Then you can do one of the following:
* `$> cat jsonfront.md | jsm`
* `$> cat jsonfront.md | jsm --parse`

which will print the parsed output to the terminal

* `$> cat jsonfront.md | jsm > htmlified.json`
* `$> cat jsonfront.md | jsm --parse > htmlified.json`

`$> cat htmlified.json`

```bash
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ],
  "__content__": "<h1 id=\"metadata-of-content\">Metadata of content</h1>"
}
```
## USAGE - From `cli` - json2markdown

### cli
* `$> cat jsonfront.md | jsm --serialize`

which will print the serialized output to the terminal

* `$> cat jsonfront.md | jsm --serialize > jsonfront.md`

`$> cat jsonfront.md`

### [jsonfront.md]

```markdown
---
{
  "name": "Metadata",
  "CONTENT": [
    "pitch",
    "news",
    "requirements",
    "program",
    "schedule",
    "support",
    "contribute",
    "about"
  ]
}
---

# Metadata of content
```
