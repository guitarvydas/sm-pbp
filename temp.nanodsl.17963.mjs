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
code {
  main = macro+
  macro =
    | space -- space
    | applySyntactic<MatchState> -- state
    | applySyntactic<MatchTransition> -- transition
    | any -- other
  MatchState = "state" "(" stateAttr+ ")" "."
  MatchTransition = "transition" "(" transitionAttr+ ")" "."

  stateAttr =
    | "value" "=" scode -- code
    | attr -- other
  transitionAttr =
    | "code" "=" tcode -- code
    | attr -- other
  attr = name "=" (str | name)

  scode = "\"" codeenter? statename codeexit? "\""
  statename = rawtext
  rawtext = (~"{" ~"\"" any)+
  codeenter = codeblock
  codeexit = codeblock
  codeblock = "{" (~"}" any)+ "}"

  tcode = "\"" guard codeblock? "\""
  guard = rawtext

  name = uletter ualnum*
  uletter = letter | "_"
  ualnum = alnum | "_"
  str = "\"" (~"\"" any)* "\""
  space += ","
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

main : function (cs,) {
enter_rule ("main");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("main");
},
macro_space : function (ws,) {
enter_rule ("macro_space");
    set_return (`${ws.rwr ()}`);
return exit_rule ("macro_space");
},
macro_state : function (s,) {
enter_rule ("macro_state");
    set_return (`${s.rwr ()}\n`);
return exit_rule ("macro_state");
},
macro_transition : function (t,) {
enter_rule ("macro_transition");
    set_return (`${t.rwr ()}\n`);
return exit_rule ("macro_transition");
},
macro_other : function (c,) {
enter_rule ("macro_other");
    set_return (`${c.rwr ()}`);
return exit_rule ("macro_other");
},
MatchState : function (_state,lp,attrs,rp,dot,) {
enter_rule ("MatchState");
    set_return (`state(${attrs.rwr ().join ('')}).`);
return exit_rule ("MatchState");
},
MatchTransition : function (_transition,lp,attrs,rp,dot,) {
enter_rule ("MatchTransition");
    set_return (`transition(${attrs.rwr ().join ('')}).`);
return exit_rule ("MatchTransition");
},
stateAttr_code : function (v,eq,c,) {
enter_rule ("stateAttr_code");
    set_return (`${c.rwr ()}`);
return exit_rule ("stateAttr_code");
},
stateAttr_other : function (a,) {
enter_rule ("stateAttr_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("stateAttr_other");
},
transitionAttr_code : function (_c,eq,c,) {
enter_rule ("transitionAttr_code");
    set_return (`${c.rwr ()}`);
return exit_rule ("transitionAttr_code");
},
transitionAttr_other : function (a,) {
enter_rule ("transitionAttr_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("transitionAttr_other");
},
attr : function (name,eq,str,) {
enter_rule ("attr");
    set_return (`${name.rwr ()}${eq.rwr ()}${str.rwr ()},`);
return exit_rule ("attr");
},
scode : function (lq,enter,name,exit,rq,) {
enter_rule ("scode");
    set_return (`name="${name.rwr ()}", enter="${enter.rwr ().join ('')}", exit="${exit.rwr ().join ('')}"`);
return exit_rule ("scode");
},
statename : function (t,) {
enter_rule ("statename");
    set_return (`${t.rwr ()}`);
return exit_rule ("statename");
},
rawtext : function (cs,) {
enter_rule ("rawtext");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("rawtext");
},
codeenter : function (b,) {
enter_rule ("codeenter");
    set_return (`${b.rwr ()}`);
return exit_rule ("codeenter");
},
codeexit : function (b,) {
enter_rule ("codeexit");
    set_return (`${b.rwr ()}`);
return exit_rule ("codeexit");
},
codeblock : function (lb,cs,rb,) {
enter_rule ("codeblock");
    set_return (`${lb.rwr ()}${cs.rwr ().join ('')}${rb.rwr ()}`);
return exit_rule ("codeblock");
},
tcode : function (lq,guard,code,rq,) {
enter_rule ("tcode");
    set_return (`guard="${guard.rwr ()}", transitioncode="${code.rwr ()}"`);
return exit_rule ("tcode");
},
guard : function (t,) {
enter_rule ("guard");
    set_return (`${t.rwr ()}`);
return exit_rule ("guard");
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

