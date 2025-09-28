import { UserModel } from "@/models/user.model";
import { DuplicateResourceError, UnauthorizedError } from "@/utils/errors";
import { Request, Response } from "express";
import zod from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV } from "@/config/envs";
import { getAuth } from "firebase-admin/auth";
import firebaseApp from "@/config/firebase";

const SignupSchema = zod.object({
  email: zod.string(),
  username: zod.string().min(2).max(100),
  password: zod.string().min(6).max(100),
});

const LoginSchema = zod.object({
  email: zod.string(),
  password: zod.string().min(6).max(100),
});

const GoogleLoginSchema = zod.object({
  token: zod.string(),
});

export const AuthController = {
  signup: async (req: Request, res: Response) => {
    const { email, username, password } = SignupSchema.parse(req.body);

    const isExistingEmail = await UserModel.findOne({ email });
    if (isExistingEmail) {
      throw new DuplicateResourceError("Email already exists", { email });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({ email, username, encryptedPassword });

    res.status(201).json({
      message: "User created successfully",
      data: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      },
    });
  },
  login: async (req: Request, res: Response) => {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password", { email });
    }

    if (user.firebaseId && !user.encryptedPassword) {
      throw new UnauthorizedError("Please login with Google", { email });
    }

    const isPasswordValid = bcrypt.compare(
      password,
      user.encryptedPassword || ""
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password", { email });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "2w" });

    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
      })
      .status(200)
      .json({
        message: "Login successful",
        data: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl || "",
        },
      });
  },
  googleLogin: async (req: Request, res: Response) => {
    const { token } = GoogleLoginSchema.parse(req.body);

    let email: string | undefined, uid: string, picture: string | undefined;

    try {
      ({ email, uid, picture } = await getAuth(firebaseApp).verifyIdToken(
        token
      ));
      if (!email) {
        throw new UnauthorizedError("Email not found in Firebase token", {});
      }
    } catch (error) {
      console.error("Error verifying Firebase ID token:", error);
      throw new UnauthorizedError("Invalid Firebase ID token", { error });
    }

    const username = await getAuth()
      .getUser(uid)
      .then((user) => user.displayName || "");

    let user = await UserModel.findOne({ email });
    if (!user) {
      user = await UserModel.create({
        email,
        username: username,
        firebaseId: uid,
        encryptedPassword: "",
        avatarUrl: picture,
      });
    } else {
      if (!user.firebaseId) {
        throw new UnauthorizedError("Please login with email and password", {
          email,
        });
      }
    }

    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "2w",
    });

    res
      .cookie("access_token", jwtToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
      })
      .status(200)
      .json({
        message: "Google login successful",
        data: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl || "",
        },
      });
  },
  logout: async (req: Request, res: Response) => {
    res
      .clearCookie("access_token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
      .status(200)
      .json({ message: "Logout successful" });
  },
  me: async (req: Request, res: Response) => {
    try {
      const token = req.cookies.access_token;

      if (!token) {
        return res.status(401).json({
          message: "Not authenticated"
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      res.status(200).json({
        message: "User retrieved successfully",
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl || "",
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(401).json({
        message: "Invalid token"
      });
    }
  },
};
