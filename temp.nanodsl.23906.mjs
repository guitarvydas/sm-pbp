'use strict'

import * as ohm from 'ohm-js';
import * as process from 'process';

const verbose = !!process.env.T2TVERBOSE;

function top (stack) { let v = stack.pop (); stack.push (v); return v; }

function set_top (stack, v) { stack.pop (); stack.push (v); return v; }

let return_value_stack = [];
let rule_name_stack = [];
let depth_prefix = ' ';

function enter_rule (name) {
    if (verbose) {
	pbplog (`${depth_prefix}enter ${name}`);
	depth_prefix += ' ';
    }
    return_value_stack.push ("");
    rule_name_stack.push (name);
}

function set_return (v) {
    set_top (return_value_stack, v);
}

function exit_rule (name) {
    if (verbose) {
	depth_prefix = depth_prefix.substr (1);
	pbplog (`${depth_prefix}exit ${name}`);
    }
    rule_name_stack.pop ();
    return return_value_stack.pop ()
}

const grammar = String.raw`
rmdiv {
  characters = char+
  char =
    | str -- str
    | any -- other
  str = "\"" schar* "\""
  schar =
    | "&lt;div " (~endbegindiv any)+ endbegindiv divcontent ediv -- div 
    | beginshortdiv (~endshortdiv any)+ endshortdiv -- shortdiv 
    | (~"\"" any) -- other
  divcontent = (~ediv any)+
  ediv = "&lt;/div&gt;"
  endbegindiv = "&quot;&gt;"
  beginshortdiv = "&lt;div&gt;"
  endshortdiv = "&lt;/div&gt;"
}
`;

let args = {};
function resetArgs () {
    args = {};
}
function memoArg (name, accessorString) {
    args [name] = accessorString;
};
function fetchArg (name) {
    return args [name];
}

// decode.mjs
import { decode } from 'html-entities';


let state_names = [];

function legalize (s) {
    return s.replace (/ /g, "_");
}

function memo_state_name (s) {
    state_names.push (s);
    return "";
}

function get_first_state_name () {
    return state_names [0];
}

function create_stepper () {
    let result = "{⤷";
    state_names.forEach (name => {
	result += `\n"${name}": self.step_${legalize (name)},`;
    });
    result += "⤶\n} [self.state] ()\n";
    return result;
}

function decodeHTML(s) {
    let prev;
    do { prev = s; s = decode(s); } while (s !== prev);
    return s;
}
let parameters = {};
function pushParameter (name, v) {
    if (!parameters [name]) {
        parameters [name] = [];
    }
    parameters [name].push (v);
}
function popParameter (name) {
    parameters [name].pop ();
}
function getParameter (name) {
    let top = parameters [name].pop ();
    parameters [name].push (top);
    return top;
}


let _rewrite = {

characters : function (cs,) {
enter_rule ("characters");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("characters");
},
char_str : function (s,) {
enter_rule ("char_str");
    set_return (`${s.rwr ()}`);
return exit_rule ("char_str");
},
char_other : function (c,) {
enter_rule ("char_other");
    set_return (`${c.rwr ()}`);
return exit_rule ("char_other");
},
str : function (lb,cs,rb,) {
enter_rule ("str");
    set_return (`${lb.rwr ()}${cs.rwr ().join ('')}${rb.rwr ()}`);
return exit_rule ("str");
},
schar_other : function (c,) {
enter_rule ("schar_other");
    set_return (`${c.rwr ()}`);
return exit_rule ("schar_other");
},
schar_div : function (_b,_stuff,_endb,content,_end,) {
enter_rule ("schar_div");
    set_return (`${content.rwr ()}`);
return exit_rule ("schar_div");
},
schar_shortdiv : function (b,cs,e,) {
enter_rule ("schar_shortdiv");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("schar_shortdiv");
},
divcontent : function (cs,) {
enter_rule ("divcontent");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("divcontent");
},
ediv : function (s,) {
enter_rule ("ediv");
    set_return (``);
return exit_rule ("ediv");
},
endbegindiv : function (s,) {
enter_rule ("endbegindiv");
    set_return (``);
return exit_rule ("endbegindiv");
},
_terminal: function () { return this.sourceString; },
_iter: function (...children) { return children.map(c => c.rwr ()); }
}
import * as fs from 'fs';

let terminated = false;

function xbreak () {
    terminated = true;
    return '';
}

function xcontinue () {
    terminated = false;
    return '';
}
    
function is_terminated () {
    return terminated;
}
function expand (src, parser) {
    let cst = parser.match (src);
    if (cst.failed ()) {
	//th  row Error (`${cst.message}\ngrammar=${grammarname (grammar)}\nsrc=\n${src}`);
	throw Error (cst.message);
    }
    let sem = parser.createSemantics ();
    sem.addOperation ('rwr', _rewrite);
    return sem (cst).rwr ();
}

function grammarname (s) {
    let n = s.search (/{/);
    return s.substr (0, n).replaceAll (/\n/g,'').trim ();
}

try {
    const argv = process.argv.slice(2);
    let srcFilename = argv[0];
    if ('-' == srcFilename) { srcFilename = 0 }
    let src = fs.readFileSync(srcFilename, 'utf-8');
    try {
	let parser = ohm.grammar (grammar);
	let s = src;
	xcontinue ();
	while (! is_terminated ()) {
	    xbreak ();
	    s = expand (s, parser);
	}
	console.log (s);
	process.exit (0);
    } catch (e) {
	//console.error (`${e}\nargv=${argv}\ngrammar=${grammarname (grammar)}\src=\n${src}`);
	console.error (`${e}\n\ngrammar = "${grammarname (grammar)}\n"`);
	process.exit (1);
    }
} catch (e) {
    console.error (`${e}\n\ngrammar = "${grammarname (grammar)}"\n`);
    process.exit (1);
}

