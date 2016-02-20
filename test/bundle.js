(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){

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
  var html    = object.__content__;
  html        = unpatch(html, object.custom);
  object.__content__  = html2markdown(html);
  var result  = jsonmatter.serialize(object, {
    delimiter: os.EOL+'---'+os.EOL+os.EOL
  });
  return '---' + os.EOL + result;
}
function unpatch (html, custom) {
  // for (var key in custom) {
  //   var htmlstring = custom[key];
  //   for (var old; old != html;){
  //     old = html;
  //     html = html.replace(
  //       htmlstring,
  //       '<a href="('+key+')">{{'+key.substr(2,key.length)+'}}</a>'
  //     );
  //   }
  // }
  if (custom) {
    throw new Error('@TODO: html2markdown parser is too smart - so not yet implemented - open an issue if you need it to be solved')
  }
  // return html;
}
function patch (html, custom) {
  for (var key in custom) {
    var regx = new RegExp('<a href="{{(' + key + ')}}">[^<>]*<\/a>', 'g');
    html = html.replace(regx, function (match, contents, offset, s) {
      return custom[key];
    })
    var regx = new RegExp('{{' + key + '}}', 'g');
    html = html.replace(regx, function (match, contents, offset, s) {
      return custom[key];
    })
  }
  return html
}

}).call(this,require('_process'))
},{"_process":11,"exemethod":3,"fs":2,"html2markdown":5,"json-matter":7,"marked":8,"os":9}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (process){


'use strict';
/******************************************************************************
  DEPENDENCIES = CUSTOM SDK [Custom Software Development Kit]
******************************************************************************/

const path = require('path');
/******************************************************************************
  PARAMETER = ARGUMENT
******************************************************************************/
// no cli tool
// $paramName = process.argv[2];
/******************************************************************************
  MODULE INTERNALS & HELPERS
******************************************************************************/
function returnMessage(msg, method) {
  console.log('==============================');
  console.log(msg);
  console.log('==============================');
  return method;
}
function exemethod(logger) {
  // logger: function (msg, method) { /*log here*/ return method; }
  // return [npm|script|globalcli|localcli|required|browserify]
  logger = logger ? logger : returnMessage;
  if (process.platform === 'linux') {
    var isLinux = true;
  } else if (process.platform === 'darwin') {
    var isMac = true;
  } else if (process.platform) {
    var isWindows = true;
  } else {
    var isBrowserified = process.title === 'browser';
  }
  var isNode = !isBrowserified;
  if (isNode) {
    var isRequired = module.parent ? module.parent.parent ? true : false : false;
    var isCLI = !isRequired;
    if (isCLI) {
      var fullpath = process.env._.split(path.sep);
      var dir = fullpath[0];
      var cmd = fullpath[fullpath.length - 1];
      var isLocal = cmd === 'node' || cmd === 'iojs';
      var isScript = dir === '.';
      var isNPM = cmd === 'npm';
      var isGlobal = !isLocal;
      if (isNPM) {
        return logger('EXEC AS: npm run ...', 'npm');
      } else if (isScript) {
        return logger('EXEC AS: standalone script', 'script');
      } else if (isGlobal) {
        return logger('EXEC AS: node cli global', 'globalcli');
      } else if (isLocal) {
        return logger('EXEC AS: node cli local', 'localcli');
      }
    } else if (isRequired) {
      return logger('EXEC AS: node required(...)', 'required');
    } else {
      throw new Error('Current usage not supported. [weird node usage]');
    }
  } else if (isBrowserified) {
    var isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      return logger('EXEC AS: browser required(...)', 'browserify');
    } else {
      throw new Error('Current usage not supported. [browserified cli]');
    }
  } else {
    throw new Error('Current usage not supported. [unknown environment]');
  }
}
/******************************************************************************
  EXPORT
******************************************************************************/
module.exports = exemethod;

}).call(this,require('_process'))
},{"_process":11,"path":10}],4:[function(require,module,exports){
/**
 * html2markdown - An HTML to Markdown converter.
 *
 * This implementation uses HTML or DOM parsing for conversion. Parsing code was
 * abstracted out in a parsing function which should be easy to remove in favor
 * of other parsing libraries.
 *
 * Converted MarkDown was tested with ShowDown library for HTML rendering. And
 * it tries to create MarkDown that does not confuse ShowDown when certain
 * combination of HTML tags come together.
 *
 * @author Himanshu Gilani
 * @author Kates Gasis (original author)
 *
 */

/**
 * html2markdown
 * @param html - html string to convert
 * @return converted markdown text
 */

/*
 Universal JavaScript Module, supports AMD (RequireJS), Node.js, and the browser.
 https://gist.github.com/kirel/1268753
*/

(function (name, definition) {
  if (typeof define === 'function') { // AMD
    define(definition);
  } else if (typeof module !== 'undefined' && module.exports) { // Node.js
    module.exports = definition();
  } else { // Browser
    var theModule = definition(), global = this, old = global[name];
    theModule.noConflict = function () {
      global[name] = old;
      return theModule;
    };
    global[name] = theModule;
  }
})('html2markdown', function() {

function trim(value) {
	return value.replace(/^\s+|\s+$/g,"");
}

function endsWith(value, suffix) {
  return value.match(suffix+"$") == suffix;
}

function startsWith(value, str) {
	return value.indexOf(str) == 0;
}

function html2markdown(html, opts) {
	opts = opts || {};

	var nodeList = [];
	var listTagStack = [];
	var linkAttrStack = [];
	var blockquoteStack = [];
	var preStack = [];
	var codeStack = [];
	var links = [];
	var inlineStyle = opts['inlineStyle'] || false;
	var parser = opts['parser'];
	var markdownTags = {
		"hr": "- - -\n\n",
		"br": "  \n",
		"title": "# ",
		"h1": "# ",
		"h2": "## ",
		"h3": "### ",
		"h4": "#### ",
		"h5": "##### ",
		"h6": "###### ",
		"b": "**",
		"strong": "**",
		"i": "_",
		"em": "_",
		"dfn": "_",
		"var": "_",
		"cite": "_",
		"span": " ",
		"ul": "* ",
		"ol": "1. ",
		"dl": "- ",
		"blockquote": "> "
	};

	if(!parser && typeof markdownDOMParser !== 'undefined')
		parser = markdownDOMParser;

	function getListMarkdownTag() {
		var listItem = "";
		if(listTagStack) {
			for ( var i = 0; i < listTagStack.length - 1; i++) {
				listItem += "  ";
			}
		}
		listItem += peek(listTagStack);
		return listItem;
	}

	function convertAttrs(attrs) {
		var attributes = {};
		for(var k in attrs) {
			var attr = attrs[k];
			attributes[attr.name] = attr;
		}
		return attributes;
	}

	function peek(list) {
		if(list && list.length > 0) {
			return list.slice(-1)[0];
		}
		return "";
	}

	function peekTillNotEmpty(list) {
		if(!list) {
			return "";
		}

		for(var i = list.length - 1; i>=0; i-- ){
			if(list[i] != "") {
				return list[i];
			}
		}
		return "";
	}

	function removeIfEmptyTag(start) {
		var cleaned = false;
		if(start == peekTillNotEmpty(nodeList)) {
			while(peek(nodeList) != start) {
				nodeList.pop();
			}
			nodeList.pop();
			cleaned = true;
		}
		return cleaned;
	}

	function sliceText(start) {
		var text = [];
		while(nodeList.length > 0 && peek(nodeList) != start) {
			var t = nodeList.pop();
			text.unshift(t);
		}
		return text.join("");
	}

	function block(isEndBlock) {
		var lastItem = nodeList.pop();
		if (!lastItem) {
			return;
		}

		if(!isEndBlock) {
			var block;
			if(/\s*\n\n\s*$/.test(lastItem)) {
				lastItem = lastItem.replace(/\s*\n\n\s*$/, "\n\n");
				block = "";
			} else if(/\s*\n\s*$/.test(lastItem)) {
				lastItem = lastItem.replace(/\s*\n\s*$/, "\n");
				block = "\n";
			} else if(/\s+$/.test(lastItem)) {
				block = "\n\n";
			} else {
				block = "\n\n";
			}

			nodeList.push(lastItem);
			nodeList.push(block);
		} else {
			nodeList.push(lastItem);
			if(!endsWith(lastItem, "\n")) {
				nodeList.push("\n\n");
			}
		}
 	}

	function listBlock() {
		if(nodeList.length > 0) {
			var li = peek(nodeList);

			if(!endsWith(li, "\n")) {
				nodeList.push("\n");
			}
		} else {
			nodeList.push("\n");
		}
	}

	parser(html,{
		start: function(tag, attrs, unary) {
			tag = tag.toLowerCase();

			if(unary && (tag != "br" && tag != "hr" && tag != "img")) {
				return;
			}

		switch (tag) {
			case "br":
				nodeList.push(markdownTags[tag]);
				break;
			case "hr":
				block();
				nodeList.push(markdownTags[tag]);
				break;
			case "title":
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
			case "h6":
				block();
				nodeList.push(markdownTags[tag]);
				break;
			case "b":
			case "strong":
			case "i":
			case "em":
			case "dfn":
			case "var":
			case "cite":
				nodeList.push(markdownTags[tag]);
				break;
			case "code":
			case "span":
				if(preStack.length > 0)
				{
					break;
				} else if(! /\s+$/.test(peek(nodeList))) {
					nodeList.push(markdownTags[tag]);
				}
				break;
			case "p":
			case "div":
			//case "td":
				block();
				break;
			case "ul":
			case "ol":
			case "dl":
				listTagStack.push(markdownTags[tag]);
				// lists are block elements
				if(listTagStack.length > 1) {
					listBlock();
				} else {
					block();
				}
				break;
			case "li":
			case "dt":
				var li = getListMarkdownTag();
				nodeList.push(li);
				break;
			case "a":
				var attribs = convertAttrs(attrs);
				linkAttrStack.push(attribs);
				nodeList.push("[");
				break;
			case "img":
				var attribs = convertAttrs(attrs);
				var alt, title, url;

				attribs["src"] ? url = attribs["src"].value : url = "";
				if(!url) {
					break;
				}

				attribs['alt'] ? alt = trim(attribs['alt'].value) : alt = "";
				attribs['title'] ? title = trim(attribs['title'].value) : title = "";

				// if parent of image tag is nested in anchor tag use inline style
				if(!inlineStyle && !startsWith(peekTillNotEmpty(nodeList), "[")) {
					var l = links.indexOf(url);
					if(l == -1) {
						links.push(url);
						l=links.length-1;
					}

					block();
					nodeList.push("![");
					if(alt!= "") {
						nodeList.push(alt);
					} else if (title != null) {
						nodeList.push(title);
					}

					nodeList.push("][" + l + "]");
					block();
				} else {
					//if image is not a link image then treat images as block elements
					if(!startsWith(peekTillNotEmpty(nodeList), "[")) {
						block();
					}

					nodeList.push("![" + alt + "](" + url + (title ? " \"" + title + "\"" : "") + ")");

					if(!startsWith(peekTillNotEmpty(nodeList), "[")) {
						block(true);
					}
				}
				break;
			case "blockquote":
				//listBlock();
				block();
				blockquoteStack.push(markdownTags[tag]);
				break;
			case "pre":
				block();
				preStack.push(true);
				nodeList.push("    ");
				break;
			case "table":
				nodeList.push("<table>");
				break;
			case "thead":
				nodeList.push("<thead>");
				break;
			case "tbody":
				nodeList.push("<tbody>");
				break;
			case "tr":
				nodeList.push("<tr>");
				break;
			case "td":
				nodeList.push("<td>");
				break;
			}
		},
		chars: function(text) {
			if(preStack.length > 0) {
				text = text.replace(/\n/g,"\n    ");
			} else if(trim(text) != "") {
				text = text.replace(/\s+/g, " ");

				var prevText = peekTillNotEmpty(nodeList);
				if(/\s+$/.test(prevText)) {
					text = text.replace(/^\s+/g, "");
				}
			} else {
				nodeList.push("");
				return;
			}

			//if(blockquoteStack.length > 0 && peekTillNotEmpty(nodeList).endsWith("\n")) {
			if(blockquoteStack.length > 0) {
				nodeList.push(blockquoteStack.join(""));
			}

			nodeList.push(text);
		},
		end: function(tag) {
			tag = tag.toLowerCase();

		switch (tag) {
			case "title":
			case "h1":
			case "h2":
			case "h3":
			case "h4":
			case "h5":
			case "h6":
				if(!removeIfEmptyTag(markdownTags[tag])) {
					block(true);
				}
				break;
			case "p":
			case "div":
			//case "td":
				while(nodeList.length > 0 && trim(peek(nodeList)) == "") {
					nodeList.pop();
				}
				block(true);
				break;
			case "b":
			case "strong":
			case "i":
			case "em":
			case "dfn":
			case "var":
			case "cite":
				if(!removeIfEmptyTag(markdownTags[tag])) {
					nodeList.push(trim(sliceText(markdownTags[tag])));
					nodeList.push(markdownTags[tag]);
				}
				break;
			case "a":
				var text = sliceText("[");
				text = text.replace(/\s+/g, " ");
				text = trim(text);

				if(text == "") {
					nodeList.pop();
					break;
				}

				var attrs = linkAttrStack.pop();
				var url;
				attrs["href"] &&  attrs["href"].value != "" ? url = attrs["href"].value : url = "";

				if(url == "") {
					nodeList.pop();
					nodeList.push(text);
					break;
				}

				nodeList.push(text);

				if(!inlineStyle && !startsWith(peek(nodeList), "!")){
					var l = links.indexOf(url);
					if(l == -1) {
						links.push(url);
						l=links.length-1;
					}
					nodeList.push("][" + l + "]");
				} else {
					if(startsWith(peek(nodeList), "!")){
						var text = nodeList.pop();
						text = nodeList.pop() + text;
						block();
						nodeList.push(text);
					}

					var title = attrs["title"];
					nodeList.push("](" + url + (title ? " \"" + trim(title.value).replace(/\s+/g, " ") + "\"" : "") + ")");

					if(startsWith(peek(nodeList), "!")){
						block(true);
					}
				}
				break;
			case "ul":
			case "ol":
			case "dl":
				listBlock();
				listTagStack.pop();
				break;
			case "li":
			case "dt":
				var li = getListMarkdownTag();
				if(!removeIfEmptyTag(li)) {
					var text = trim(sliceText(li));

					if(startsWith(text, "[![")) {
						nodeList.pop();
						block();
						nodeList.push(text);
						block(true);
					} else {
						nodeList.push(text);
						listBlock();
					}
				}
				break;
			case "blockquote":
				blockquoteStack.pop();
				break;
			case "pre":
				//uncomment following experimental code to discard line numbers when syntax highlighters are used
				//notes this code thorough testing before production user
				/*
				var p=[];
				var flag = true;
				var count = 0, whiteSpace = 0, line = 0;
				console.log(">> " + peek(nodeList));
				while(peek(nodeList).startsWith("    ") || flag == true)
				{
					//console.log('inside');
					var text = nodeList.pop();
					p.push(text);

					if(flag == true && !text.startsWith("    ")) {
						continue;
					} else {
						flag = false;
					}

					//var result = parseInt(text.trim());
					if(!isNaN(text.trim())) {
						count++;
					} else if(text.trim() == ""){
						whiteSpace++;
					} else {
						line++;
					}
					flag = false;
				}

				console.log(line);
				if(line != 0)
				{
					while(p.length != 0) {
						nodeList.push(p.pop());
					}
				}
				*/
				block(true);
				preStack.pop();
				break;
			case "code":
			case "span":
				if(preStack.length > 0)
				{
					break;
				} else if(trim(peek(nodeList)) == "") {
					nodeList.pop();
					nodeList.push(markdownTags[tag]);
				} else {
					var text = nodeList.pop();
					nodeList.push(trim(text));
					nodeList.push(markdownTags[tag]);
				}
				break;
			case "table":
				nodeList.push("</table>");
				break;
			case "thead":
				nodeList.push("</thead>");
				break;
			case "tbody":
				nodeList.push("</tbody>");
				break;
			case "tr":
				nodeList.push("</tr>");
				break;
			case "td":
				nodeList.push("</td>");
				break;
			case "br":
			case "hr":
			case "img":
				break;
			}

		}
	}, {"nodesToIgnore": ["script", "noscript", "object", "iframe", "frame", "head", "style", "label"]});

	if(!inlineStyle) {
		for ( var i = 0; i < links.length; i++) {
			if(i == 0) {
				var lastItem = nodeList.pop();
				nodeList.push(lastItem.replace(/\s+$/g, ""));
				nodeList.push("\n\n[" + i + "]: " + links[i]);
			} else {
				nodeList.push("\n[" + i + "]: " + links[i]);
			}
		}
	}

	return nodeList.join("");

}

return html2markdown;

});
},{}],5:[function(require,module,exports){
var html2markdown = require('./html2markdown');
var htmlParser = require('./markdown_html_parser');

module.exports = function(html, opts) {
  opts = opts || {};
  opts.parser = htmlParser;
  return html2markdown(html, opts);
};

},{"./html2markdown":4,"./markdown_html_parser":6}],6:[function(require,module,exports){
/*
 * HTML Parser By John Resig (ejohn.org)
 * Original code by Erik Arvidsson, Mozilla Public License
 * http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 *
 * // Use like so:
 * HTMLParser(htmlString, {
 *     start: function(tag, attrs, unary) {},
 *     end: function(tag) {},
 *     chars: function(text) {},
 *     comment: function(text) {}
 * });
 *
 * // or to get an XML string:
 * HTMLtoXML(htmlString);
 *
 * // or to get an XML DOM Document
 * HTMLtoDOM(htmlString);
 *
 * // or to inject into an existing document/DOM node
 * HTMLtoDOM(htmlString, document);
 * HTMLtoDOM(htmlString, document.body);
 *
 */

/*
 Universal JavaScript Module, supports AMD (RequireJS), Node.js, and the browser.
 https://gist.github.com/kirel/1268753
*/

(function (name, definition) {
  if (typeof define === 'function') { // AMD
    define(definition);
  } else if (typeof module !== 'undefined' && module.exports) { // Node.js
    module.exports = definition();
  } else { // Browser
    var theModule = definition(), global = this, old = global[name];
    theModule.noConflict = function () {
      global[name] = old;
      return theModule;
    };
    global[name] = theModule;
  }
})('markdownHTMLParser', function() {

	// Regular Expressions for parsing tags and attributes
	var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		endTag = /^<\/(\w+)[^>]*>/,
		attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

	// Empty Elements - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Block Elements - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Inline Elements - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Attributes that have their values filled in disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Special Elements (can contain anything)
	var special = makeMap("script,style");

	function HTMLParser( html, handler ) {
		var index, chars, match, stack = [], last = html;
		stack.last = function(){
			return this[ this.length - 1 ];
		};

		while ( html ) {
			chars = true;

			// Make sure we're not in a script or style element
			if ( !stack.last() || !special[ stack.last() ] ) {

				// Comment
				if ( html.indexOf("<!--") == 0 ) {
					index = html.indexOf("-->");

					if ( index >= 0 ) {
						if ( handler.comment )
							handler.comment( html.substring( 4, index ) );
						html = html.substring( index + 3 );
						chars = false;
					}

				// end tag
				} else if ( html.indexOf("</") == 0 ) {
					match = html.match( endTag );

					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( endTag, parseEndTag );
						chars = false;
					}

				// start tag
				} else if ( html.indexOf("<") == 0 ) {
					match = html.match( startTag );

					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( startTag, parseStartTag );
						chars = false;
					}
				}

				if ( chars ) {
					index = html.indexOf("<");

					var text = index < 0 ? html : html.substring( 0, index );
					html = index < 0 ? "" : html.substring( index );

					if ( handler.chars )
						handler.chars( text );
				}

			} else {
				html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), function(all, text){
					text = text.replace(/<!--(.*?)-->/g, "$1")
						.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

					if ( handler.chars )
						handler.chars( text );

					return "";
				});

				parseEndTag( "", stack.last() );
			}

			if ( html == last )
				throw "Parse Error: " + html;
			last = html;
		}

		// Clean up any remaining tags
		parseEndTag();

		function parseStartTag( tag, tagName, rest, unary ) {
			if ( block[ tagName ] ) {
				while ( stack.last() && inline[ stack.last() ] ) {
					parseEndTag( "", stack.last() );
				}
			}

			if ( closeSelf[ tagName ] && stack.last() == tagName ) {
				parseEndTag( "", tagName );
			}

			unary = empty[ tagName ] || !!unary;

			if ( !unary )
				stack.push( tagName );

			if ( handler.start ) {
				var attrs = [];

				rest.replace(attr, function(match, name) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : "";

					attrs.push({
						name: name,
						value: value,
						escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
					});
				});

				if ( handler.start )
					handler.start( tagName, attrs, unary );
			}
		}

		function parseEndTag( tag, tagName ) {
			// If no tag name is provided, clean shop
			if ( !tagName )
				var pos = 0;

			// Find the closest opened tag of the same type
			else
				for ( var pos = stack.length - 1; pos >= 0; pos-- )
					if ( stack[ pos ] == tagName )
						break;

			if ( pos >= 0 ) {
				// Close all the open elements, up the stack
				for ( var i = stack.length - 1; i >= pos; i-- )
					if ( handler.end )
						handler.end( stack[ i ] );

				// Remove the open elements from the stack
				stack.length = pos;
			}
		}
	};

	this.HTMLtoXML = function( html ) {
		var results = "";

		HTMLParser(html, {
			start: function( tag, attrs, unary ) {
				results += "<" + tag;

				for ( var i = 0; i < attrs.length; i++ )
					results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';

				results += (unary ? "/" : "") + ">";
			},
			end: function( tag ) {
				results += "</" + tag + ">";
			},
			chars: function( text ) {
				results += text;
			},
			comment: function( text ) {
				results += "<!--" + text + "-->";
			}
		});

		return results;
	};

	this.HTMLtoDOM = function( html, doc ) {
		// There can be only one of these elements
		var one = makeMap("html,head,body,title");

		// Enforce a structure for the document
		var structure = {
			link: "head",
			base: "head"
		};

		if ( !doc ) {
			if ( typeof DOMDocument != "undefined" )
				doc = new DOMDocument();
			else if ( typeof document != "undefined" && document.implementation && document.implementation.createDocument )
				doc = document.implementation.createDocument("", "", null);
			else if ( typeof ActiveX != "undefined" )
				doc = new ActiveXObject("Msxml.DOMDocument");

		} else
			doc = doc.ownerDocument ||
				doc.getOwnerDocument && doc.getOwnerDocument() ||
				doc;

		var elems = [],
			documentElement = doc.documentElement ||
				doc.getDocumentElement && doc.getDocumentElement();

		// If we're dealing with an empty document then we
		// need to pre-populate it with the HTML document structure
		if ( !documentElement && doc.createElement ) (function(){
			var html = doc.createElement("html");
			var head = doc.createElement("head");
			head.appendChild( doc.createElement("title") );
			html.appendChild( head );
			html.appendChild( doc.createElement("body") );
			doc.appendChild( html );
		})();

		// Find all the unique elements
		if ( doc.getElementsByTagName )
			for ( var i in one )
				one[ i ] = doc.getElementsByTagName( i )[0];

		// If we're working with a document, inject contents into
		// the body element
		var curParentNode = one.body;

		HTMLParser( html, {
			start: function( tagName, attrs, unary ) {
				// If it's a pre-built element, then we can ignore
				// its construction
				if ( one[ tagName ] ) {
					curParentNode = one[ tagName ];
					return;
				}

				var elem = doc.createElement( tagName );

				for ( var attr in attrs )
					elem.setAttribute( attrs[ attr ].name, attrs[ attr ].value );

				if ( structure[ tagName ] && typeof one[ structure[ tagName ] ] != "boolean" )
					one[ structure[ tagName ] ].appendChild( elem );

				else if ( curParentNode && curParentNode.appendChild )
					curParentNode.appendChild( elem );

				if ( !unary ) {
					elems.push( elem );
					curParentNode = elem;
				}
			},
			end: function( tag ) {
				elems.length -= 1;

				// Init the new parentNode
				curParentNode = elems[ elems.length - 1 ];
			},
			chars: function( text ) {
				curParentNode.appendChild( doc.createTextNode( text ) );
			},
			comment: function( text ) {
				// create comment node
			}
		});

		return doc;
	};

	function makeMap(str){
		var obj = {}, items = str.split(",");
		for ( var i = 0; i < items.length; i++ )
			obj[ items[i] ] = true;
		return obj;
	}

	return HTMLParser;

});
},{}],7:[function(require,module,exports){
'use strict';

var DEFAULT_REGEX = /^(\{[\s\S]*?\n\})(\s*\n)*/;

/**
 * Parses JSON front matter from specified `string`, returning the object itself
 * augmented with `__content__` property (this name is configurable via `alias` option)
 * where the rest content resides.
 *
 * By default it parses indented JSON (such as the one you get via
 * `JSON.stringify(myobj, null, 2)`, so it only looks for a single closing
 * right brace sitting on the line start.
 * The rest content can be delimited from JSON using arbitrary
 * number of blank lines.
 *
 * Options:
 *
 *  * `alias` — variable name to assign text content to (default is `__content__`)
 *  * `regex` — regex for capturing the JSON object and stripping it away
 *    from the rest content; the first capturing group should enclose the JSON object
 *    (default is `^(\{[\s\S]*?\n\})(?:\s*\n)*`)
 *
 * @param {String} string — input string
 * @param {*} options — options described above
 */
exports.parse = function (string, options) {
  options = options || {};
  // configurables
  var regex = options.regex || DEFAULT_REGEX;
  var alias = options.alias || '__content__';
  // parse it like a pro
  var result = {};
  string = string.replace(regex, function (match, json) {
    try {
      result = JSON.parse(json);
      return '';
    } catch (e) {
      return match;
    }
  });
  result[alias] = string;
  return result;
};

/**
 * Reverse parse: removes `__content__` property from the `object` and emits it
 * as indented JSON; then appends the `__content__` property to resulting string
 * with optional delimiter specified via `delimiter` options (by default a single
 * blank line is inserted).
 *
 * Options are:
 *
 *  * `alias` — variable name containing the rest content
 *    (default is `__content__`, like in `parse`)
 *  * `delimiter` — a string to insert between JSON and rest content
 *    (default is `\n\n`)
 *
 * @param {*} object — object to serialize;
 * @param {*} options — options described above
 */
exports.serialize = function (object, options) {
  options = options || {};
  // configurable
  var delimiter = options.delimiter || '\n\n';
  var alias = options.alias || '__content__';
  // Extract the content
  var content = object[alias] || '';
  // Properties are copied onto the new object to prevent side-effects
  var obj = {};
  Object.keys(object).forEach(function (key) {
    if (key != alias)
      obj[key] = object[key];
  });
  // Write them
  return JSON.stringify(obj, null, 2) + delimiter + content;
};

},{}],8:[function(require,module,exports){
(function (global){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

;(function() {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^( *[-*_]){3,} *(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
  nptable: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
  table: noop,
  paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
  text: /^[^\n]+/
};

block.bullet = /(?:[*+-]|\d+\.)/;
block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
block.item = replace(block.item, 'gm')
  (/bull/g, block.bullet)
  ();

block.list = replace(block.list)
  (/bull/g, block.bullet)
  ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
  ('def', '\\n+(?=' + block.def.source + ')')
  ();

block.blockquote = replace(block.blockquote)
  ('def', block.def)
  ();

block._tag = '(?!(?:'
  + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
  + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
  + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

block.html = replace(block.html)
  ('comment', /<!--[\s\S]*?-->/)
  ('closed', /<(tag)[\s\S]+?<\/\1>/)
  ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
  (/tag/g, block._tag)
  ();

block.paragraph = replace(block.paragraph)
  ('hr', block.hr)
  ('heading', block.heading)
  ('lheading', block.lheading)
  ('blockquote', block.blockquote)
  ('tag', '<' + block._tag)
  ('def', block.def)
  ();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,
  paragraph: /^/
});

block.gfm.paragraph = replace(block.paragraph)
  ('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  ();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
  table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = {};
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top, bq) {
  var src = src.replace(/^ +$/gm, '')
    , next
    , loose
    , cap
    , bull
    , b
    , item
    , space
    , i
    , l;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? cap.replace(/\n+$/, '')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2],
        text: cap[3]
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (top && (cap = this.rules.nptable.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i].split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top, true);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];

      this.tokens.push({
        type: 'list_start',
        ordered: bull.length > 1
      });

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) +/, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (this.options.smartLists && i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull !== b && !(bull.length > 1 && b.length > 1)) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        this.tokens.push({
          type: loose
            ? 'loose_item_start'
            : 'list_item_start'
        });

        // Recurse.
        this.token(item, false, bq);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: cap[0]
      });
      continue;
    }

    // def
    if ((!bq && top) && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.links[cap[1].toLowerCase()] = {
        href: cap[2],
        title: cap[3]
      };
      continue;
    }

    // table (gfm)
    if (top && (cap = this.rules.table.exec(src))) {
      src = src.substring(cap[0].length);

      item = {
        type: 'table',
        header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
      };

      for (i = 0; i < item.align.length; i++) {
        if (/^ *-+: *$/.test(item.align[i])) {
          item.align[i] = 'right';
        } else if (/^ *:-+: *$/.test(item.align[i])) {
          item.align[i] = 'center';
        } else if (/^ *:-+ *$/.test(item.align[i])) {
          item.align[i] = 'left';
        } else {
          item.align[i] = null;
        }
      }

      for (i = 0; i < item.cells.length; i++) {
        item.cells[i] = item.cells[i]
          .replace(/^ *\| *| *\| *$/g, '')
          .split(/ *\| */);
      }

      this.tokens.push(item);

      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
  autolink: /^<([^ >]+(@|:\/)[^ >]+)>/,
  url: noop,
  tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,
  link: /^!?\[(inside)\]\(href\)/,
  reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
  nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
  strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
  em: /^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
  code: /^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,
  br: /^ {2,}\n(?!\s*$)/,
  del: noop,
  text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
};

inline._inside = /(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;
inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

inline.link = replace(inline.link)
  ('inside', inline._inside)
  ('href', inline._href)
  ();

inline.reflink = replace(inline.reflink)
  ('inside', inline._inside)
  ();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: replace(inline.escape)('])', '~|])')(),
  url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
  del: /^~~(?=\S)([\s\S]*?\S)~~/,
  text: replace(inline.text)
    (']|', '~]|')
    ('|', '|https?://|')
    ()
});

/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: replace(inline.br)('{2,}', '*')(),
  text: replace(inline.gfm.text)('{2,}', '*')()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer;
  this.renderer.options = this.options;

  if (!this.links) {
    throw new
      Error('Tokens array requires a `links` property.');
  }

  if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  } else if (this.options.pedantic) {
    this.rules = inline.pedantic;
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = ''
    , link
    , text
    , href
    , cap;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += cap[1];
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = cap[1].charAt(6) === ':'
          ? this.mangle(cap[1].substring(7))
          : this.mangle(cap[1]);
        href = this.mangle('mailto:') + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      src = src.substring(cap[0].length);
      text = escape(cap[1]);
      href = text;
      out += this.renderer.link(href, null, text);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      src = src.substring(cap[0].length);
      this.inLink = true;
      out += this.outputLink(cap, {
        href: cap[2],
        title: cap[3]
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2], true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(this.smartypants(cap[0]));
      continue;
    }

    if (src) {
      throw new
        Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = escape(link.href)
    , title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/--/g, '\u2014')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  var out = ''
    , l = text.length
    , i = 0
    , ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || {};
}

Renderer.prototype.code = function(code, lang, escaped) {
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '\n</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '\n</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw) {
  return '<h'
    + level
    + ' id="'
    + this.options.headerPrefix
    + raw.toLowerCase().replace(/[^\w]+/g, '-')
    + '">'
    + text
    + '</h'
    + level
    + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered) {
  var type = ordered ? 'ol' : 'ul';
  return '<' + type + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + '<tbody>\n'
    + body
    + '</tbody>\n'
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' style="text-align:' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  if (this.options.sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return '';
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
      return '';
    }
  }
  var out = '<a href="' + href + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer;
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options, renderer) {
  var parser = new Parser(options, renderer);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options, this.renderer);
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        this.token.text);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = ''
        , body = ''
        , i
        , row
        , cell
        , flags
        , j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        flags = { header: true, align: this.token.align[i] };
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      var body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      var body = ''
        , ordered = this.token.ordered;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered);
    }
    case 'list_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'loose_item_start': {
      var body = '';

      while (this.next().type !== 'list_item_end') {
        body += this.tok();
      }

      return this.renderer.listitem(body);
    }
    case 'html': {
      var html = !this.token.pre && !this.options.pedantic
        ? this.inline.output(this.token.text)
        : this.token.text;
      return this.renderer.html(html);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
  }
};

/**
 * Helpers
 */

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescape(html) {
  return html.replace(/&([#\w]+);/g, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function replace(regex, opt) {
  regex = regex.source;
  opt = opt || '';
  return function self(name, val) {
    if (!name) return new RegExp(regex, opt);
    val = val.source || val;
    val = val.replace(/(^|[^\[])\^/g, '$1');
    regex = regex.replace(name, val);
    return self;
  };
}

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1
    , target
    , key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}


/**
 * Marked
 */

function marked(src, opt, callback) {
  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight
      , tokens
      , pending
      , i = 0;

    try {
      tokens = Lexer.lex(src, opt)
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/chjj/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occured:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.defaults = {
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  silent: false,
  highlight: null,
  langPrefix: 'lang-',
  smartypants: false,
  headerPrefix: '',
  renderer: new Renderer,
  xhtml: false
};

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.parse = marked;

if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = marked;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return marked; });
} else {
  this.marked = marked;
}

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
exports.endianness = function () { return 'LE' };

exports.hostname = function () {
    if (typeof location !== 'undefined') {
        return location.hostname
    }
    else return '';
};

exports.loadavg = function () { return [] };

exports.uptime = function () { return 0 };

exports.freemem = function () {
    return Number.MAX_VALUE;
};

exports.totalmem = function () {
    return Number.MAX_VALUE;
};

exports.cpus = function () { return [] };

exports.type = function () { return 'Browser' };

exports.release = function () {
    if (typeof navigator !== 'undefined') {
        return navigator.appVersion;
    }
    return '';
};

exports.networkInterfaces
= exports.getNetworkInterfaces
= function () { return {} };

exports.arch = function () { return 'javascript' };

exports.platform = function () { return 'browser' };

exports.tmpdir = exports.tmpDir = function () {
    return '/tmp';
};

exports.EOL = '\n';

},{}],10:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":11}],11:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],12:[function(require,module,exports){
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

},{"..":1}]},{},[12]);
