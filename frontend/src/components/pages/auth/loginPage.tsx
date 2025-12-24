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

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import axios from "axios";

const LoginPage = () => {
  return (
    <main className="flex items-center justify-center bg-background px-4 py-20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email below to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginWithEmail />

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
            Don't have an account?{" "}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export const LoginWithGoogle = () => {
  const { user, googleLoginMutation } = useAuth();
  const { isPending, error } = googleLoginMutation;

  console.log(error);

  const navigate = useNavigate();

  // Navigate to home on successful login
  useEffect(() => {
    if (user) {
      navigate("/");
      googleLoginMutation.reset();
    }
  }, [user, navigate]);

  return (
    <>
      {" "}
      {user && (
        <div className="text-sm text-green-600 text-center bg-green-50 dark:bg-green-900/20 p-2 rounded">
          {"Login successful"}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {axios.isAxiosError(error)
            ? error.response?.data?.errors[0].message || "Login failed"
            : error.message}
        </div>
      )}
      <Button
        variant="outline"
        className="w-full my-3"
        disabled={isPending}
        onClick={() => googleLoginMutation.mutate()}>
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>
    </>
  );
};

const LoginWithEmail = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { user, loginMutation } = useAuth();
  const { isPending, error } = loginMutation;

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
      loginMutation.reset();
    }
  }, [user, navigate]);

  return (
    <div className="space-y-4">
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
            ? error.response?.data?.errors[0].message || "Login failed"
            : error.message}
        </div>
      )}

      {user && (
        <div className="text-sm text-green-600 text-center bg-green-50 dark:bg-green-900/20 p-2 rounded">
          {"Login successful"}
        </div>
      )}

      <Button
        className="w-full"
        disabled={isPending}
        onClick={() => loginMutation.mutate({ email, password })}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </div>
  );
};

export default LoginPage;
