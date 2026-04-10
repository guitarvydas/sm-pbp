import sys
import kernel0d as zd

import looper

class Env:
    def __init__ (self):
        self.x = 0
        self.w = 100
        self.eh = None
        self.mev = None
        self.reverse = self.rev
        self.update = self.upd
    def rev (self):
        zd.send (self.eh, "reverse", "", self.mev)
        zd.send (self.eh, "", " ** reverse **", self.mev)
    def upd (self, s):
        if self.eh:
            zd.send (self.eh, "update", s, self.mev)
        
        
def handler (eh,mev):
    uut = eh.instance_data
    try:
        if mev.port == "min":
            pass
        elif mev.port == "max":
            uut.w = int (mev.datum.v)
        elif mev.port == "x":
            uut.env.x = int (mev.datum.v)
            uut.env.mev = mev
            uut.step ()
            zd.send (eh, "", f"x={uut.env.x} state={uut.state}", mev)
            zd.send (eh, "next", "", mev)
        else:
            raise Exception (f'unknown port {mev.port}')
    except Exception as ex:
        zd.send (eh, "✗", f"*** error in testenvelope.py ({ex}) ***", mev)

def reset_handler (eh):
    uut = eh.instance_data
    uut.x = 0
    
def instantiate (reg,owner,name, arg, template_data):
    name_with_id = zd.gensymbol ("Test Envelope")
    env = Env ()
    uut = looper.SM_looper(env=env) # uut == unit under test
    eh = zd.make_leaf ( name_with_id, owner, uut, arg, handler, reset_handler)
    env.eh = eh
    reset_handler (eh)
    return eh

# define template
def install (reg):
    zd.register_component (reg, zd.mkTemplate ("Test Envelope", None, instantiate))


