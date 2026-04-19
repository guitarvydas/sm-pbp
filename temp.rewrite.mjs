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

Main : function (State,) {
enter_rule ("Main");
    set_return (`class SM_✣:⤷
      ${State.rwr ().join ('')}
      def __init__ (self, env):⤷
          self.env = env
          self.state = None
	  self.enter_${get_first_state_name ()} ()⤶
      def step (self):⤷
          ${create_stepper ()}⤶⤶
      `);
return exit_rule ("Main");
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
