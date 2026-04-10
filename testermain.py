import sys
import kernel0d as zd

import stimulus
import testenvelope

[palette, env] = zd.initialize_from_files (sys.argv[3:])
stimulus.install (palette)
testenvelope.install (palette)
top = zd.start_bare (part_name=sys.argv[2], palette=palette, env=env)
zd.inject (top, "", "")
zd.finalize (top)

