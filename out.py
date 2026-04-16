class SM_✣:
    
    def enter_idle (self):
        e = self.env
        self.state = "idle"
        e.update (" >> entering 'idle'")
        
    def step_idle (self):
        e = self.env
        if (e.x > e.max):
            self.exit_idle ()
            e.reverse ()
            self.enter_wait_for_max_recrossing ()
        if (e.x < e.min):
            self.exit_idle ()
            e.reverse ()
            self.enter_wait_for_min_recrossing ()
    def exit_idle (self):
        e = self.env
        pass
    def enter_wait_for_max_recrossing (self):
        e = self.env
        self.state = "wait for max recrossing"
        e.update (" >> entering 'wait for max recrossing'")
        
    def step_wait_for_max_recrossing (self):
        e = self.env
        if (e.x < e.max):
            self.exit_wait_for_max_recrossing ()
            self.enter_idle ()
    def exit_wait_for_max_recrossing (self):
        e = self.env
        pass
    def enter_wait_for_min_recrossing (self):
        e = self.env
        self.state = "wait for min recrossing"
        e.update (" >> entering 'wait for min recrossing'")
        
    def step_wait_for_min_recrossing (self):
        e = self.env
        if (e.x > e.min):
            self.exit_wait_for_min_recrossing ()
            self.enter_idle ()
    def exit_wait_for_min_recrossing (self):
        e = self.env
        pass
    def enter_idle (self):
        e = self.env
        self.state = "idle"
        e.update (" >> entering 'idle'")
        
    def step_idle (self):
        e = self.env
        if (e.x <= e.xmin):
            self.exit_idle ()
            e.scoreRight ()
            self.enter_idle ()
    def exit_idle (self):
        e = self.env
        pass
    def enter_left_paddle (self):
        e = self.env
        self.state = "left_paddle"
        e.update (" >> entering 'left_paddle'")
        
    def step_left_paddle (self):
        e = self.env
        
    def exit_left_paddle (self):
        e = self.env
        pass
    def enter_right_paddle (self):
        e = self.env
        self.state = "right_paddle"
        e.update (" >> entering 'right_paddle'")
        
    def step_right_paddle (self):
        e = self.env
        
    def exit_right_paddle (self):
        e = self.env
        pass
    def enter_ceiling (self):
        e = self.env
        self.state = "ceiling"
        e.update (" >> entering 'ceiling'")
        
    def step_ceiling (self):
        e = self.env
        
    def exit_ceiling (self):
        e = self.env
        pass
    def enter_floor (self):
        e = self.env
        self.state = "floor"
        e.update (" >> entering 'floor'")
        
    def step_floor (self):
        e = self.env
        
    def exit_floor (self):
        e = self.env
        pass
    def __init__ (self, env):
        self.env = env
        self.state = None
        self.enter_idle ()
    def step (self):
        {
            "idle": self.step_idle,
            "wait for max recrossing": self.step_wait_for_max_recrossing,
            "wait for min recrossing": self.step_wait_for_min_recrossing,
            "idle": self.step_idle,
            "left_paddle": self.step_left_paddle,
            "right_paddle": self.step_right_paddle,
            "ceiling": self.step_ceiling,
            "floor": self.step_floor,
        } [self.state] ()