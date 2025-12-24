import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth";
import { LoginWithGoogle } from "@/components/pages/auth/loginPage";
import axios from "axios";

const SignupPage = () => {
  return (
    <div className="flex items-center justify-center bg-background px-4 py-20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmailSignup />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <LoginWithGoogle />

          <div className="text-center text-sm">
            Already have an account?
            <Link to="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EmailSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { signupMutation } = useAuth();

  const { data, isPending, error } = signupMutation;

  const navigate = useNavigate();

  // Navigate to login on successful signup
  useEffect(() => {
    if (data) {
      navigate("/login");
    }
  }, [data, navigate]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {axios.isAxiosError(error)
            ? error.response?.data?.errors[0].message || "Signup failed"
            : error.message}
        </div>
      )}

      {data && (
        <div className="text-sm text-green-600 text-center bg-green-50 dark:bg-green-900/20 p-2 rounded">
          {"Signup successful"}
        </div>
      )}

      <Button
        className="w-full"
        disabled={isPending}
        onClick={() => signupMutation.mutate({ email, password, username })}>
        {isPending ? "Signing up..." : "Sign up"}
      </Button>
    </div>
  );
};

export default SignupPage;
