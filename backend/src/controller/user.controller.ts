import { Request, Response } from "express";

export const UserController = {
  updateUser: async (req: Request, res: Response) => {
    res.send("User update route is working");
  },
};
