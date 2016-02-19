# json-meta-marked
Convert markdown with json front matter to json object with metadata &amp; html.  
Works in both directions.  
Works as `cli` and `required module`

**special feature**  
If you include a custom `field` in the `json` front matter, you can include `{{field}}` or `[]({{field}})` in the markdown part and in the transformation process, those placeholders in the markdown will be replaced with the value of the custom `field` of the json front matter

## example
```md
---
{
  "foo": "bar",
  "custom": {
    "something": "world",
    "beep": "boop"
  }
}
---

# Hello {{something}}

This is an example, [{{beep}}]({{beep}})

[//]: # (@TODO: this is a comment)

* one
* two
* three

yay, foobar :-)
```

will be transformed to:

```json
{
  "foo": "bar",
  "custom": {
    "something": "world",
    "beep": "boop"
  },
  "__content__": "<h1 id=\"hello-something-\">Hello world</h1><p>This is an example, boop</p><ul><li>one</li><li>two</li><li>three</li></ul><p>yay, foobar :-)</p>"
}

```

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
var jmm = require('json-meta-marked');
var fs  = require('fs');
var obj = jmm.parse(fs.readFileSync('jsonfront.md'));
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
var jmm = require('json-meta-marked');
var fs  = require('fs');
var obj = JSON.parse(fs.readFileSync('htmlified.json'));
console.log(jmm.serialize(obj));
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
* `$> cat jsonfront.md | jmm`
* `$> cat jsonfront.md | jmm --parse`

which will print the parsed output to the terminal

* `$> cat jsonfront.md | jmm > htmlified.json`
* `$> cat jsonfront.md | jmm --parse > htmlified.json`

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
* `$> cat jsonfront.md | jmm --serialize`

which will print the serialized output to the terminal

* `$> cat jsonfront.md | jmm --serialize > jsonfront.md`

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
