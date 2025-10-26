import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RegisterUser, LoginUser } from "@shared/schema";
import cyberBackground from "@assets/cyberBackground.png";

interface CyberpunkTerminalProps {
  onLogin: () => void;
}

export function CyberpunkTerminal({ onLogin }: CyberpunkTerminalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });
  const { toast } = useToast();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      return await apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: async () => {
      // Clear cache and wait for session to propagate
      queryClient.clear();
      
      // Force immediate refresh of auth state
      setTimeout(() => {
        window.location.reload();
      }, 200);
      
      toast({
        title: "GRID ACCESS GRANTED", 
        description: "Neural link established successfully",
      });
    },
    onError: () => {
      toast({
        title: "ACCESS DENIED",
        description: "Invalid credentials. Try again.",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser) => {
      return await apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: async () => {
      // Clear cache and wait for session to propagate  
      queryClient.clear();
      setShowRegister(false);
      
      // Force immediate refresh of auth state
      setTimeout(() => {
        window.location.reload();
      }, 200);
      
      toast({
        title: "NEURAL ID CREATED",
        description: "Welcome to the grid",
      });
    },
    onError: (error: any) => {
      toast({
        title: "REGISTRATION FAILED",
        description: error.message?.includes('Invalid email') 
          ? "Please enter a valid email address (like user@gmail.com)"
          : error.message || "Failed to create neural ID",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    loginMutation.mutate({ username, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.fullName || !registerData.password) return;
    
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-black relative overflow-hidden">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(hsl(180 100% 50% / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(180 100% 50% / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Main Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-6xl md:text-8xl font-bold font-mono mb-4"
            style={{
              color: 'hsl(180 100% 70%)',
              textShadow: '0 0 20px hsl(180 100% 70% / 0.5), 0 0 40px hsl(180 100% 70% / 0.3), 0 0 60px hsl(180 100% 70% / 0.2)'
            }}
            data-testid="text-app-title"
          >
            CYBERCONTACTS
          </h1>
          <h2 
            className="text-4xl md:text-6xl font-bold font-mono"
            style={{
              color: 'hsl(0 100% 60%)',
              textShadow: '0 0 20px hsl(0 100% 60% / 0.5), 0 0 40px hsl(0 100% 60% / 0.3)'
            }}
            data-testid="text-app-year"
          >
            2077
          </h2>
          <p 
            className="text-lg md:text-xl font-mono mt-6 text-foreground/80"
            data-testid="text-app-subtitle"
          >
            NEURAL LINK DIRECTORY SYSTEM
          </p>
          <div 
            className="w-32 h-1 mx-auto mt-4"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(180 100% 70%), transparent)',
              boxShadow: '0 0 10px hsl(180 100% 70% / 0.5)'
            }}
          />
        </div>

        {/* Terminal Login Box */}
        <div 
          className="w-full max-w-md p-8 rounded-lg border-2 bg-card/50 backdrop-blur-sm"
          style={{
            borderColor: 'hsl(180 100% 50%)',
            boxShadow: '0 0 30px hsl(180 100% 50% / 0.3), inset 0 0 30px hsl(180 100% 50% / 0.1)'
          }}
          data-testid="container-access-terminal"
        >
          <h3 
            className="text-2xl font-bold font-mono text-center mb-2"
            style={{
              color: 'hsl(180 100% 70%)',
              textShadow: '0 0 10px hsl(180 100% 70% / 0.5)'
            }}
            data-testid="text-access-terminal"
          >
            ACCESS TERMINAL
          </h3>
          <p className="text-center text-sm font-mono text-muted-foreground mb-8">
            Authenticate Neural Interface
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-mono text-foreground mb-2">
                USER ID
              </label>
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                data-testid="input-username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono text-foreground mb-2">
                ACCESS CODE
              </label>
              <Input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                data-testid="input-password"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full font-mono font-bold text-lg py-6"
              style={{
                background: 'transparent',
                borderColor: 'hsl(180 100% 50%)',
                color: 'hsl(180 100% 70%)',
                textShadow: '0 0 10px hsl(180 100% 70% / 0.5)',
                boxShadow: '0 0 20px hsl(180 100% 50% / 0.3)'
              }}
              variant="outline"
              data-testid="button-connect-grid"
            >
              {loginMutation.isPending ? "CONNECTING..." : "CONNECT TO GRID"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm font-mono text-muted-foreground">
                Need a neural link? New to the grid?
              </p>
              
              <Dialog open={showRegister} onOpenChange={setShowRegister}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="font-mono mt-2"
                    style={{
                      color: 'hsl(0 100% 60%)',
                      borderColor: 'hsl(0 100% 60%)'
                    }}
                    data-testid="button-create-neural-id"
                  >
                    CREATE NEW NEURAL ID
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-md border-2 bg-card/95 backdrop-blur-sm"
                  style={{
                    borderColor: 'hsl(180 100% 50%)',
                    boxShadow: '0 0 30px hsl(180 100% 50% / 0.3)',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${cyberBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                  data-testid="modal-register"
                >
                  <DialogHeader>
                    <DialogTitle 
                      className="font-mono text-xl font-bold"
                      style={{
                        color: 'hsl(180 100% 90%)',
                        textShadow: '0 0 15px hsl(180 100% 90% / 0.8), 0 0 25px hsl(180 100% 90% / 0.5)'
                      }}
                    >
                      CREATE NEURAL ID
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-username" className="font-mono text-sm font-semibold" style={{
                        color: 'hsl(180 100% 85%)',
                        textShadow: '0 0 8px hsl(180 100% 85% / 0.6)'
                      }}>
                        USERNAME
                      </Label>
                      <Input
                        id="reg-username"
                        placeholder="Choose username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                        data-testid="input-register-username"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-fullname" className="font-mono text-sm font-semibold" style={{
                        color: 'hsl(180 100% 85%)',
                        textShadow: '0 0 8px hsl(180 100% 85% / 0.6)'
                      }}>
                        FULL NAME
                      </Label>
                      <Input
                        id="reg-fullname"
                        placeholder="Enter full name"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                        data-testid="input-register-fullname"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-email" className="font-mono text-sm font-semibold" style={{
                        color: 'hsl(180 100% 85%)',
                        textShadow: '0 0 8px hsl(180 100% 85% / 0.6)'
                      }}>
                        EMAIL (OPTIONAL)
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="name@domain.net"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                        data-testid="input-register-email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="reg-password" className="font-mono text-sm font-semibold" style={{
                        color: 'hsl(180 100% 85%)',
                        textShadow: '0 0 8px hsl(180 100% 85% / 0.6)'
                      }}>
                        ACCESS CODE
                      </Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="••••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="font-mono bg-input/50 border-primary/50 focus:border-primary focus:ring-primary/30"
                        data-testid="input-register-password"
                        required
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRegister(false)}
                        className="flex-1 font-mono border-destructive/50 text-destructive hover:bg-destructive/10"
                        data-testid="button-cancel-register"
                      >
                        ABORT
                      </Button>
                      <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="flex-1 font-mono border-2"
                        style={{
                          borderColor: 'hsl(180 100% 50%)',
                          backgroundColor: 'hsl(180 100% 50% / 0.1)',
                          color: 'hsl(180 100% 90%)',
                          textShadow: '0 0 10px hsl(180 100% 90% / 0.5)'
                        }}
                        data-testid="button-create-register"
                      >
                        {registerMutation.isPending ? "CREATING..." : "CREATE NEURAL ID"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </form>

          <div className="flex justify-between text-xs font-mono text-muted-foreground mt-8">
            <span>GRID: ONLINE</span>
            <span>ENCRYPTION: ACTIVE</span>
            <span>LATENCY: 12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}