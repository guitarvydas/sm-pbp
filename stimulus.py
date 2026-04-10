import sys
import kernel0d as zd

class Coordinates:
    def __init__ (self):
        self.x = 0
        self.step = 25
        self.max = 25
        self.count = 0

def handler (eh,mev):
    coords = eh.instance_data
    try:
        if mev.port == "":
            zd.send (eh, "x", coords.x, mev)
        elif mev.port == "next":
            coords.count += 1
            if coords.count <= coords.max:
                coords.x += coords.step
                zd.send (eh, "x", coords.x, mev)
        elif mev.port == "reverse":
            coords.step = -coords.step
        else:
            raise Exception (f"unknown port '{mev.port}'")
    except Exception as ex:
        zd.send (eh, "✗", f"*** error in stimulus.py ({ex}) ***", mev)
        
def reset_handler (eh):
    coords = eh.instance_data
    coords.x = 0

def instantiate (reg,owner,name, arg, template_data):
    name_with_id = zd.gensymbol ( "Stimulus")
    coords = Coordinates ()
    eh = zd.make_leaf ( name_with_id, owner, coords, arg, handler, reset_handler)
    reset_handler (eh)
    return eh

# define template
def install (reg):
    zd.register_component (reg, zd.mkTemplate ("Stimulus", None, instantiate))


