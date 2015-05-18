#! /usr/bin/env node
'use strict';
/******************************************************************************
  DEPENDENCIES = CUSTOM SDK [Custom Software Development Kit]
******************************************************************************/
var jsonmatter    = require('json-matter');
var marked        = require('marked');
var html2markdown = require('html2markdown');
var method        = require('exemethod')(function(a,b){return b;})
var fs            = require('fs');
var os            = require('os');
/******************************************************************************
  PARAMETER = ARGUMENT + [Sanitize & Validate]
******************************************************************************/
var args          = process.argv.slice(2);
function setInput (error, mode, string, filename) {
  if (error) { throw error; }
  var $mode       = mode;
  var $string     = string;
  var $filename   = filename;
}
/******************************************************************************
  EXPORT
******************************************************************************/
// REQUIRED MODULE
if ({'required':true,'browserify':true}[method]) {
  module.exports =  {
    parse           : parse,
    serialize       : serialize
  };
} else if ({'npm':true,'script':true,'globalcli':true,'localcli':true}[method]) {
  // $ node -p -e 'process.stdin.isTTY' // => true
  if (process.stdin.isTTY) {
    // SERVER $> cli --server
    if (args[0] === '--server') {
      console.log('SERVER with REPL');
      console.log('To abort press: CTRL+D or CTRL+C');
      setInput(null, args[0], null, null);
      startDeamon();
    // CLI $> cli --serialize filename
    } else {
      console.log('NORMAL CLI EXECUTION');
      throw new Error('@TODO: serialize/parse from cli not implemented yet!');
      if (args[1]) { // CLI + 2 args
        setInput(null, args[0], null, args[1]);
      } else if (args[0]) { // CLI + 1 arg
        setInput(null, '--parse', null, args[0]);
      } else { // CLI + no args
        setInput(new Error('@TODO: add --help option & show when given no args'));
      }
    }
  // $ echo 'foo' | node -p -e 'process.stdin.isTTY' // => undefined
  // @TODO: !!!! Maybe "method='npm'" will not count as normal cli execution !!!! !!!!!!!!!
  } else if (args[0] === '--server') {
    setInput(new Error('@TODO: add stream into server deamon process'));
  // PIPED
  } else if (args[0]) {
    var $mode = args[0];
    startStream();
    startDeamon();
  } else if (!args.length) {
    var $mode     = '--parse';
    startStream();
    startDeamon();
  } else {
    throw new Error('@TODO: whats wrong here???');
  }
} else {
  throw new Error('@TODO: unsupported method: '+method);
}
/******************************************************************************
  PIPE STREAM
******************************************************************************/
function startStream () {
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(data) {
    return {
      "--parse"     : function (string) {
        var result = parse(string);
        // stringify parsed object
        // process.stderr.write('asdf')
        process.stdout.write(JSON.stringify(result, null, 2));
      },
      "--serialize" : function (string) {
        var result = serialize(JSON.parse(string));
        process.stdout.write(result);
      }
    }[$mode](data);
  });
}
/******************************************************************************
  UNIX SIGNALS
******************************************************************************/
function startDeamon () {
  // ps aux | grep yourscript
  // kill -s SIGINT [process_id]
  process.stdin.resume();
  process.on('SIGINT', function (err) {
    // An easy way to send the SIGINT signal is with Control-C in most terminal programs.
    // Note:
    //   SIGUSR1 is reserved by node.js to start the debugger. It's possible to install a listener but that won't stop the debugger from starting.
    //   SIGTERM and SIGINT have default handlers on non-Windows platforms that resets the terminal mode before exiting with code 128 + signal number. If one of these signals has a listener installed, its default behaviour will be removed (node will no longer exit).
    //   SIGPIPE is ignored by default, it can have a listener installed.
    //   SIGHUP is generated on Windows when the console window is closed, and on other platforms under various similar conditions, see signal(7). It can have a listener installed, however node will be unconditionally terminated by Windows about 10 seconds later. On non-Windows platforms, the default behaviour of SIGHUP is to terminate node, but once a listener has been installed its default behaviour will be removed.
    //   SIGTERM is not supported on Windows, it can be listened on.
    //   SIGINT from the terminal is supported on all platforms, and can usually be generated with CTRL+C (though this may be configurable). It is not generated when terminal raw mode is enabled.
    //   SIGBREAK is delivered on Windows when CTRL+BREAK is pressed, on non-Windows platforms it can be listened on, but there is no way to send or generate it.
    //   SIGWINCH is delivered when the console has been resized. On Windows, this will only happen on write to the console when the cursor is being moved, or when a readable tty is used in raw mode.
    //   SIGKILL cannot have a listener installed, it will unconditionally terminate node on all platforms.
    //   SIGSTOP cannot have a listener installed.
    //   Note that Windows does not support sending Signals, but node offers some emulation with process.kill(), and child_process.kill(): - Sending signal 0 can be used to search for the existence of a process - Sending SIGINT, SIGTERM, and SIGKILL cause the unconditional exit of the target process.
    console.log('Got a SIGINT. Goodbye cruel world.');
    if (err) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
/******************************************************************************
  MODULE INTERNALS & HELPERS
******************************************************************************/
function parse (string) {
  var result = jsonmatter.parse(string, {
    regex: /^[\s\t\n\r]*---{1}[\s\t\n\r]*(\{[\s\S]*\}[\s\t\n\r]*)(---{1})/
  });
  var markdown        = result.__content__;
  var html            = marked(markdown).replace(/\r?\n|\r/g, "");
  result.__content__  = patch(html, result.custom);
  return result;
}
function serialize (object) {
  // @TODO: maybe have option to make HTML file with frontmatter in
  //        <!-- front matter --> at the beginning of the file
  var html    = object.__content__;
  html        = unpatch(html, object.custom);
  object.__content__  = html2markdown(html);
  var result  = jsonmatter.serialize(object, {
    delimiter: os.EOL+'---'+os.EOL+os.EOL
  });
  return '---' + os.EOL + result;
}
function unpatch (html, custom) {
  console.error('=== UNPATCHING ... ===');
  /* unpatch HTML
    @TODO: replace all
      custom[#!actionName];
      with
      <a href="#!actionName">&lt;Action Name&gt;</a>
  */
  return html; // just returned unchanged 'content' if !custom
}
function patch (html, custom) {
  console.error('=== PATCHING ... ===');
  /* patch HTML
    @TODO: replace all
      <a href="#!actionName">&lt;Action Name&gt;</a>
      with
      custom[#!actionName];
  */
  return html; // just returned unchanged 'content' if !custom
}
