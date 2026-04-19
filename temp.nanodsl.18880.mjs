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
kinds {
  Top = name "{" Array+ "}"
  Array = name "{" attr* Object+ "}"
  attr = ~"kind" name "=" str
  transitionAttr =
    | "kind" "=" "\"" "edge" "\""      -- kind
    | attr                             -- other
  transitionCodeAttr =
    | "kind" "=" "\"" "edgeLabel" "\"" -- kind
    | attr                             -- other
  stateAttr = 
    | "kind" "=" "\"" "ellipse" "\""   -- kind
    | attr                             -- other
  Object =
    | name "{" transitionAttr+ "}"     -- transition
    | name "{" transitionCodeAttr+ "}" -- transitionCode
    | name "{" stateAttr+ "}"          -- state
  name = uletter ualnum*
  uletter = letter | "_"
  ualnum = alnum | "_"
  str = "\"" (~"\"" any)* "\""
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

Top : function (name,lb,Array,rb,) {
enter_rule ("Top");
    set_return (`${name.rwr ()} {${Array.rwr ().join ('')}}`);
return exit_rule ("Top");
},
Array : function (name,lb,attr,Object,rb,) {
enter_rule ("Array");
    set_return (`\n${name.rwr ()} {\n${attr.rwr ().join ('')}${Object.rwr ().join ('')}\n}`);
return exit_rule ("Array");
},
attr : function (name,eq,str,) {
enter_rule ("attr");
    set_return (` ${name.rwr ()}${eq.rwr ()}${str.rwr ()}`);
return exit_rule ("attr");
},
transitionAttr_kind : function (a,b,c,d,e,) {
enter_rule ("transitionAttr_kind");
    set_return (``);
return exit_rule ("transitionAttr_kind");
},
transitionAttr_other : function (a,) {
enter_rule ("transitionAttr_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("transitionAttr_other");
},
transitionCodeAttr_kind : function (a,b,c,d,e,) {
enter_rule ("transitionCodeAttr_kind");
    set_return (``);
return exit_rule ("transitionCodeAttr_kind");
},
transitionCodeAttr_other : function (a,) {
enter_rule ("transitionCodeAttr_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("transitionCodeAttr_other");
},
stateAttr_kind : function (a,b,c,d,e,) {
enter_rule ("stateAttr_kind");
    set_return (``);
return exit_rule ("stateAttr_kind");
},
stateAttr_other : function (a,) {
enter_rule ("stateAttr_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("stateAttr_other");
},
Object_transition : function (name,lb,attr,rb,) {
enter_rule ("Object_transition");
    set_return (`\ntransition {${attr.rwr ().join ('')}}`);
return exit_rule ("Object_transition");
},
Object_transitionCode : function (name,lb,attr,rb,) {
enter_rule ("Object_transitionCode");
    set_return (`\ntransitionCode {${attr.rwr ().join ('')}}`);
return exit_rule ("Object_transitionCode");
},
Object_state : function (name,lb,attr,rb,) {
enter_rule ("Object_state");
    set_return (`\nstate {${attr.rwr ().join ('')}}`);
return exit_rule ("Object_state");
},
name : function (uletter,ualnum,) {
enter_rule ("name");
    set_return (`${uletter.rwr ()}${ualnum.rwr ().join ('')}`);
return exit_rule ("name");
},
uletter : function (c,) {
enter_rule ("uletter");
    set_return (`${c.rwr ()}`);
return exit_rule ("uletter");
},
ualnum : function (c,) {
enter_rule ("ualnum");
    set_return (`${c.rwr ()}`);
return exit_rule ("ualnum");
},
str : function (lq,cs,rq,) {
enter_rule ("str");
    set_return (`${lq.rwr ()}${cs.rwr ().join ('')}${rq.rwr ()}`);
return exit_rule ("str");
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

