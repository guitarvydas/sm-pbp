From State Machine Diagram to Python

I walk through a simple three-state state machine with an idle state and two “wait for recrossing” states, showing how transitions fire based on guards like x ＞ max or x ＜ min (with e encapsulating environment values such as x, max, min). 

I demonstrate converting the diagram into a textual intermediate representation called SM and then generating equivalent Python code with enter, step, and exit sections per state. 

I explain how each event triggers transition tests, runs transition code (e.g., e.reverse), exits the current state, and enters the next state, or otherwise falls through to remain in the current state. 

I note that the  idle state has two mutually exclusive transitions. I want to enforce that only one fires by adding returns after a transition. To accomplish this, I update the T2T rewrite rules in sm-metapy.rwr to insert returns in generated code.

I note that the Python is not optimized but aims to stay true to the diagram, and mention experimental, not-yet-debugged work applying these drawings to a collision detector for the PBP Pong project. 
  
00:00 Three State Overview
00:58 Dot SM Text Format
01:35 States Enter Step Exit
02:39 Guards And Transitions
03:18 Generated Python Code
04:22 Ensuring Single Transition
05:11 Updating The Code Emitter
06:02 Results And Next Steps

code repository: [https://github.com/guitarvydas/sm-pbp](https://github.com/guitarvydas/sm-pbp)