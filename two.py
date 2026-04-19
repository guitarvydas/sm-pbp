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
        
class SM_Page_2:
    
    def enter_idle2 (self):
        e = self.env
        self.state = "idle2"
        e.update (" >> entering 'idle2'")
        
    def step_idle2 (self):
        e = self.env
        if (e.x > e.max):
            self.exit_idle2 ()
            e.reverse ()
            self.enter_S2 ()
        if (e.x < e.min):
            self.exit_idle2 ()
            e.reverse ()
            self.enter_S3 ()
    def exit_idle2 (self):
        e = self.env
        pass
    def enter_S2 (self):
        e = self.env
        self.state = "S2"
        e.update (" >> entering 'S2'")
        
    def step_S2 (self):
        e = self.env
        if (e.x < e.max):
            self.exit_S2 ()
            self.enter_idle2 ()
    def exit_S2 (self):
        e = self.env
        pass
    def enter_S3 (self):
        e = self.env
        self.state = "S3"
        e.update (" >> entering 'S3'")
        
    def step_S3 (self):
        e = self.env
        if (e.x > e.min):
            self.exit_S3 ()
            self.enter_idle2 ()
    def exit_S3 (self):
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
            "idle2": self.step_idle2,
            "S2": self.step_S2,
            "S3": self.step_S3,
        } [self.state] ()