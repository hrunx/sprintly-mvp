import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Welcome back!");
      // Invalidate and refetch auth query to ensure user data is loaded
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      // Longer delay to ensure query completes and state updates
      setTimeout(() => {
        setLocation("/");
      }, 300);
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      // Invalidate and refetch auth query to ensure user data is loaded
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      // Longer delay to ensure query completes and state updates
      setTimeout(() => {
        setLocation("/");
      }, 300);
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !registerName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (registerPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    registerMutation.mutate({
      email: registerEmail,
      password: registerPassword,
      name: registerName,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt="Logo" className="h-16 w-16 rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          <p className="text-muted-foreground mt-2">Please sign in to continue</p>
        </div>

        {/* Login/Register Tabs */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up to start matching with investors</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Demo Credentials */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo Account:</strong>
              <br />
              Email: demo@sprintly.ai
              <br />
              Password: demo1234
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
