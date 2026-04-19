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
sm {
  Main = Machine+
  Machine = "machine" name "{" State+ "}"
  State = "state" name "{" Enter Step Exit "}"
  Enter = enteraction
  Step = action
  Exit = action
  enteraction =
    | "{}" -- empty
    | action -- other
  action =
    | "{}" -- empty
    | "{" stuff* "}" -- other
  stuff =
    | "{" stuff* "}" -- rec
    | applySyntactic<Next> -- nextStatement
    | ~"{" ~"}" any -- other
  Next = "%next" name "%when" expr transitionCode?
  name = 
    | "'" (~"'" any)+ "'"    -- squoted
    | "\"" (~"\"" any)+ "\""  -- dquoted
  expr = "(" (~")" any)+ ")"
  transitionCode = "{" transitionCodeInnard* "}"
  transitionCodeInnard =
    | "{" transitionCodeInnard* "}" -- rec
    | ~"{" ~"}" any -- other
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

parameters ["statename"] = [];

let _rewrite = {

Main : function (m,) {
enter_rule ("Main");
    set_return (`${m.rwr ().join ('')}`);
return exit_rule ("Main");
},
Machine : function (_machine,name,lb,State,rb,) {
enter_rule ("Machine");
    set_return (`class SM_${name.rwr ()}:⤷
      ${State.rwr ().join ('')}
      def __init__ (self, env):⤷
          self.env = env
          self.state = None
	  self.enter_${get_first_state_name ()} ()⤶
      def step (self):⤷
          ${create_stepper ()}⤶⤶
      `);
return exit_rule ("Machine");
},
State : function (_state,name,lb,Enter,Step,Exit,rb,) {
enter_rule ("State");
    pushParameter ("statename", `${name.rwr ()}`);
    memo_state_name (`${name.rwr ()}`,);
    
    set_return (`${Enter.rwr ()}${Step.rwr ()}${Exit.rwr ()}`);

popParameter ("statename");
return exit_rule ("State");
},
Enter : function (a,) {
enter_rule ("Enter");
    set_return (`\ndef enter_${legalize (`${getParameter ("statename")}`,)} (self):⤷\ne = self.env\nself.state = "${getParameter ("statename")}"\ne.update (" >> entering '${getParameter ("statename")}'")\n${a.rwr ()}⤶`);
return exit_rule ("Enter");
},
Step : function (a,) {
enter_rule ("Step");
    set_return (`\ndef step_${legalize (`${getParameter ("statename")}`,)} (self):⤷\ne = self.env${a.rwr ()}⤶`);
return exit_rule ("Step");
},
Exit : function (a,) {
enter_rule ("Exit");
    set_return (`\ndef exit_${legalize (`${getParameter ("statename")}`,)} (self):⤷\ne = self.env${a.rwr ()}⤶`);
return exit_rule ("Exit");
},
enteraction_empty : function (_,) {
enter_rule ("enteraction_empty");
    set_return (``);
return exit_rule ("enteraction_empty");
},
enteraction_other : function (a,) {
enter_rule ("enteraction_other");
    set_return (`${a.rwr ()}`);
return exit_rule ("enteraction_other");
},
action_empty : function (_,) {
enter_rule ("action_empty");
    set_return (`\npass`);
return exit_rule ("action_empty");
},
action_other : function (lb,stuff,rb,) {
enter_rule ("action_other");
    set_return (`${stuff.rwr ().join ('')}`);
return exit_rule ("action_other");
},
stuff_rec : function (lb,stuff,rb,) {
enter_rule ("stuff_rec");
    set_return (`${lb.rwr ()}${stuff.rwr ().join ('')}${rb.rwr ()}`);
return exit_rule ("stuff_rec");
},
stuff_nextStatement : function (n,) {
enter_rule ("stuff_nextStatement");
    set_return (`${n.rwr ()}`);
return exit_rule ("stuff_nextStatement");
},
stuff_other : function (c,) {
enter_rule ("stuff_other");
    set_return (`${c.rwr ()}`);
return exit_rule ("stuff_other");
},
Next : function (_next,name,_when,e,transitionCode,) {
enter_rule ("Next");
    set_return (`\nif ${e.rwr ()}:⤷\nself.exit_${legalize (`${getParameter ("statename")}`,)} ()${transitionCode.rwr ().join ('')}\nself.enter_${legalize (`${name.rwr ()}`,)} ()⤶`);
return exit_rule ("Next");
},
name_squoted : function (lq,cs,rq,) {
enter_rule ("name_squoted");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("name_squoted");
},
name_dquoted : function (lq,cs,rq,) {
enter_rule ("name_dquoted");
    set_return (`${cs.rwr ().join ('')}`);
return exit_rule ("name_dquoted");
},
expr : function (lb,cs,rb,) {
enter_rule ("expr");
    set_return (`${lb.rwr ()}${cs.rwr ().join ('')}${rb.rwr ()}`);
return exit_rule ("expr");
},
transitionCode : function (lb,code,rb,) {
enter_rule ("transitionCode");
    set_return (`\n${code.rwr ().join ('')}`);
return exit_rule ("transitionCode");
},
transitionCodeInnard_rec : function (lb,cs,rb,) {
enter_rule ("transitionCodeInnard_rec");
    set_return (`${lb.rwr ()}${cs.rwr ().join ('')}${rb.rwr ()}`);
return exit_rule ("transitionCodeInnard_rec");
},
transitionCodeInnard_other : function (c,) {
enter_rule ("transitionCodeInnard_other");
    set_return (`${c.rwr ()}`);
return exit_rule ("transitionCodeInnard_other");
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

