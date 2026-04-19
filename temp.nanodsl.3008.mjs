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
rmgeometry {
  Main = Header Diagram+ "</mxfile>"
  Header = "<mxfile" attribute+ ">"
  Diagram = "<diagram" attribute+ ">" GraphModel+ "</diagram>"
  GraphModel = "<mxGraphModel" attribute+ ">" Root "</mxGraphModel>"
  Root = "<root>" Cell+ "</root>"

  Cell =
    | "<mxCell" attribute+ ">" Geometry "</mxCell>" -- long
    | "<mxCell" attribute+ "/>"  -- short

  Geometry =
    | "<mxGeometry" attribute+ ">" (~endGeometry any)+ endGeometry -- long
    | "<mxGeometry" attribute+ "/>" -- short
  endGeometry = "</mxGeometry>"

  attribute = name "=" str
  name = letter alnum*
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

Main : function (_begin,Diagram,_end,) {
enter_rule ("Main");
    set_return (`group {\n${Diagram.rwr ().join ('')}\n}`);
return exit_rule ("Main");
},
Header : function (_begin,attr,gt,) {
enter_rule ("Header");
    set_return (``);
return exit_rule ("Header");
},
Diagram : function (_begin,attrs,gt,GraphModels,_end,) {
enter_rule ("Diagram");
    set_return (`\ndiagram {${attrs.rwr ().join ('')}${GraphModels.rwr ().join ('')}\n}`);
return exit_rule ("Diagram");
},
GraphModel : function (_begin,attribute,gt,Root,_end,) {
enter_rule ("GraphModel");
    set_return (`${Root.rwr ()}`);
return exit_rule ("GraphModel");
},
Root : function (_begin,Cells,_end,) {
enter_rule ("Root");
    set_return (`${Cells.rwr ().join ('')}`);
return exit_rule ("Root");
},
Cell_long : function (_begin,attributes,gt,Geometry,_end,) {
enter_rule ("Cell_long");
    set_return (`\ncell {${attributes.rwr ().join ('')}\n}`);
return exit_rule ("Cell_long");
},
Cell_short : function (_begin,attributes,slashgt,) {
enter_rule ("Cell_short");
    set_return (``);
return exit_rule ("Cell_short");
},
Geometry_long : function (_begin,attribute,gt,cs,endGeometry,) {
enter_rule ("Geometry_long");
    set_return (``);
return exit_rule ("Geometry_long");
},
Geometry_short : function (_begin,attribute,slashgt,) {
enter_rule ("Geometry_short");
    set_return (``);
return exit_rule ("Geometry_short");
},
endGeometry : function (_,) {
enter_rule ("endGeometry");
    set_return (``);
return exit_rule ("endGeometry");
},
attribute : function (name,eq,str,) {
enter_rule ("attribute");
    set_return (`\n${name.rwr ()}=${str.rwr ()}`);
return exit_rule ("attribute");
},
name : function (letter,alnum,) {
enter_rule ("name");
    set_return (`${letter.rwr ()}${alnum.rwr ().join ('')}`);
return exit_rule ("name");
},
str : function (_begin,cs,_end,) {
enter_rule ("str");
    set_return (`"${cs.rwr ().join ('')}"`);
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

