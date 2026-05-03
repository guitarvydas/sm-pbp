class SM_looper:
    
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
            return
        if (e.x < e.min):
            self.exit_idle ()
            e.reverse ()
            self.enter_wait_for_min_recrossing ()
            return
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
            return
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
            return
    def exit_wait_for_min_recrossing (self):
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
        } [self.state] ()