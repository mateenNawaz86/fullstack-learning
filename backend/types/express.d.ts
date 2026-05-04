import type { IUserDocument } from "../models/user.models";

// Extend Express Request so req.user is typed everywhere after protect middleware
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}
