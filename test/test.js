/******************************************************************************
  IMPORT MODULES
******************************************************************************/
var jmm = require('..')
/******************************************************************************
  DUMMY DATA
******************************************************************************/
var markdown = [
  '  ',
  '---',
  '{',
  '  "foo": "bar",',
  '  "custom": {',
  '    "something": "world",',
  '    "beep": "boop"',
  '  }',
  '}',
  '---',
  '',
  '# Hello {{something}}',
  '',
  'This is an example, [{{beep}}]({{beep}})',
  '',
  '[//]: # (@TODO: this is a comment)',
  '',
  '* one',
  '* two',
  '* three',
  '',
  'yay, foobar :-)',
].join('\n')
/******************************************************************************
  EXAMPLE
******************************************************************************/
var rawMarkdown   = document.createElement('xmp')
var hr1           = document.createElement('hr')
var markdownHTML  = document.createElement('div')
var hr2           = document.createElement('hr')
var rawJMM        = document.createElement('xmp')

var x = jmm.parse(markdown)

rawMarkdown.innerHTML   = markdown
markdownHTML.innerHTML  = x.__content__
rawJMM.innerHTML        = JSON.stringify(x, null, 2)

document.body.appendChild(rawMarkdown)
document.body.appendChild(hr1)
document.body.appendChild(markdownHTML)
document.body.appendChild(hr2)
document.body.appendChild(rawJMM)

console.log(x)
