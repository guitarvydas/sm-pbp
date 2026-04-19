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

parameters ["diagramid"] = [];

let _rewrite = {

Group : function (_,lb,Array,rb,) {
enter_rule ("Group");
    set_return (`${Array.rwr ().join ('')}`);
return exit_rule ("Group");
},
Diagram : function (_,lb,dgmid,Object,rb,) {
enter_rule ("Diagram");
    pushParameter ("diagramid", `${dgmid.rwr ()}`);
    set_return (`
:- discontiguous diagram/1.
:- discontiguous trCode/4.
:- discontiguous transition/5.
:- discontiguous state/4.
diagram(${dgmid.rwr ()}).${Object.rwr ().join ('')}`);
popParameter ("diagramid");
return exit_rule ("Diagram");
},
dgmid : function (name,eq,str,) {
enter_rule ("dgmid");
    set_return (` did=${str.rwr ()},`);
return exit_rule ("dgmid");
},
attr_long : function (name,eq,lstr,) {
enter_rule ("attr_long");
    set_return (` ${name.rwr ()}${eq.rwr ()}${lstr.rwr ()},`);
return exit_rule ("attr_long");
},
attr_other : function (name,eq,str,) {
enter_rule ("attr_other");
    set_return (` ${name.rwr ()}${eq.rwr ()}${str.rwr ()},`);
return exit_rule ("attr_other");
},
Object_transition : function (_,lb,attr,rb,) {
enter_rule ("Object_transition");
    set_return (`\ntransition(${getParameter ("diagramid")}${attr.rwr ().join ('')}).`);
return exit_rule ("Object_transition");
},
Object_transitionCode : function (_,lb,attr,rb,) {
enter_rule ("Object_transitionCode");
    set_return (`\ntrCode(${getParameter ("diagramid")}${attr.rwr ().join ('')}).`);
return exit_rule ("Object_transitionCode");
},
Object_state : function (_,lb,attr,rb,) {
enter_rule ("Object_state");
    set_return (`\nstate(${getParameter ("diagramid")}${attr.rwr ().join ('')}).`);
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
lstr_long : function (lq,lcs,dash,rcs,rq,) {
enter_rule ("lstr_long");
    set_return (`i${rcs.rwr ().join ('')}`);
return exit_rule ("lstr_long");
},
lstr_other : function (s,) {
enter_rule ("lstr_other");
    set_return (`${s.rwr ()}`);
return exit_rule ("lstr_other");
},
_terminal: function () { return this.sourceString; },
_iter: function (...children) { return children.map(c => c.rwr ()); }
}
