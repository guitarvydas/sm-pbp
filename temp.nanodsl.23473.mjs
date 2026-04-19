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
cull {
  Main = "group" "{" Diagram+ "}"
  Diagram = "diagram" "{" attr+ Cell+ "}"
  Cell = "cell" "{" attr+ "}"
  attr =
    | "style" "=" "\"" "edgeStyle" strtail -- edgeStyle
    | "style" "=" "\"" "edgeLabel" strtail -- edgeLabel
    | "style" "=" "\"" "ellipse" strtail -- ellipse
    | "id" "=" str -- id
    | "parent" "=" str -- parent
    | "value" "=" str -- value
    | "source" "=" str -- source
    | "target" "=" str -- target
    | "name" "=" str -- name
    | name "=" str -- ignore
  name = letter alnum*
  str = "\"" strtail
  strtail = schar* "\""
  schar = ~"\"" any
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

Main : function (group,lb,diagrams,rb,) {
enter_rule ("Main");
    set_return (`group {${diagrams.rwr ().join ('')}}`);
return exit_rule ("Main");
},
Diagram : function (_,lb,attrs,cells,rb,) {
enter_rule ("Diagram");
    set_return (`\ndiagram {${attrs.rwr ().join ('')} ${cells.rwr ().join ('')}}`);
return exit_rule ("Diagram");
},
Cell : function (_,lb,attrs,rb,) {
enter_rule ("Cell");
    set_return (`\ncell {${attrs.rwr ().join ('')}}`);
return exit_rule ("Cell");
},
attr_edgeStyle : function (name,eq,dq,edgeLabel,tail,) {
enter_rule ("attr_edgeStyle");
    set_return (`\nkind="edge"`);
return exit_rule ("attr_edgeStyle");
},
attr_edgeLabel : function (name,eq,dq,edgeLabel,tail,) {
enter_rule ("attr_edgeLabel");
    set_return (`\nkind="edgeLabel"`);
return exit_rule ("attr_edgeLabel");
},
attr_ellipse : function (name,eq,dq,ellipse,tail,) {
enter_rule ("attr_ellipse");
    set_return (`\nkind="ellipse"`);
return exit_rule ("attr_ellipse");
},
attr_id : function (name,eq,str,) {
enter_rule ("attr_id");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_id");
},
attr_parent : function (name,eq,str,) {
enter_rule ("attr_parent");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_parent");
},
attr_value : function (name,eq,str,) {
enter_rule ("attr_value");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_value");
},
attr_source : function (name,eq,str,) {
enter_rule ("attr_source");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_source");
},
attr_target : function (name,eq,str,) {
enter_rule ("attr_target");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_target");
},
attr_name : function (name,eq,str,) {
enter_rule ("attr_name");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attr_name");
},
attr_ignore : function (name,eq,str,) {
enter_rule ("attr_ignore");
    set_return (``);
return exit_rule ("attr_ignore");
},
name : function (letter,alnum,) {
enter_rule ("name");
    set_return (`${letter.rwr ()}${alnum.rwr ().join ('')}`);
return exit_rule ("name");
},
str : function (_begin,tail,) {
enter_rule ("str");
    set_return (`"${tail.rwr ()}`);
return exit_rule ("str");
},
strtail : function (cs,_end,) {
enter_rule ("strtail");
    set_return (`${cs.rwr ().join ('')}"`);
return exit_rule ("strtail");
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

