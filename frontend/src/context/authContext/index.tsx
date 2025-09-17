import React, { useContext, useEffect } from "react";
import axios from "axios";
import { request } from "@/utils/api";
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import zod from "zod";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase";

const LoginResponseSchema = zod.object({
  message: zod.string(),
  data: zod.object({
    username: zod.string(),
    email: zod.string(),
    avatarUrl: zod.string().optional(),
  }),
});

const SignUpResponseSchema = zod.object({
  message: zod.string(),
  data: zod.object({
    username: zod.string(),
    email: zod.string(),
  }),
});

const LogoutResponseSchema = zod.object({
  message: zod.string(),
  data: zod.object({}),
});

type User = {
  email: string;
  username?: string;
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  logoutMutation: UseMutationResult<{ data: {} }, Error, void, unknown>;
  googleLoginMutation: UseMutationResult<{ data: User }, Error, void, unknown>;
  loginMutation: UseMutationResult<
    { data: User },
    Error,
    { email: string; password: string },
    unknown
  >;
  signupMutation: UseMutationResult<
    { data: User },
    Error,
    { email: string; password: string; username: string },
    unknown
  >;
};

const authContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me", {
          withCredentials: true,
        });

        const data = res.data;
        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, []);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      request({
        method: "POST",
        url: "/auth/login",
        data: { email, password },
        schema: LoginResponseSchema,
      }),
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(["user"], res.data);
    },
  });

  const signupMutation = useMutation({
    mutationFn: ({
      email,
      password,
      username,
    }: {
      email: string;
      password: string;
      username: string;
    }) =>
      request({
        method: "POST",
        url: "/auth/signup",
        data: { email, password, username },
        schema: SignUpResponseSchema,
      }),
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential) {
        throw new Error("Google login failed: no credential");
      }

      const idToken = await result.user.getIdToken();
      const res = await request({
        method: "POST",
        url: "/auth/google",
        data: { token: idToken },
        schema: LoginResponseSchema,
      });

      return res;
    },
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(["user"], res.data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logging out...");
      const res = await request({
        method: "POST",
        url: "/auth/logout",
        data: {},
        schema: LogoutResponseSchema,
      });
      return res;
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["user"], null);
    },
  });

  return (
    <authContext.Provider
      value={{
        user,
        loginMutation,
        signupMutation,
        logoutMutation,
        googleLoginMutation,
      }}>
      {children}
    </authContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
