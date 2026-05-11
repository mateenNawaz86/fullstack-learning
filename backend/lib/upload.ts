import multer from "multer";
import { Request } from "express";

// Multer is a middleware that parses multipart/form-data requests (file uploads).
// Without it, req.body and req.file are both undefined for file upload requests.
// After it runs: req.body → text fields, req.file → the uploaded file object.

// memoryStorage keeps the file as a Buffer on req.file.buffer.
// WHY not diskStorage?
// → diskStorage writes the file to disk first, then you upload it to Cloudinary.
//   That means two I/O operations and stale temp files to clean up.
// → memoryStorage keeps it in RAM and we stream directly to Cloudinary — faster
//   and no disk cleanup needed.
// TRADEOFF: large files consume RAM. For receipts under 5MB this is fine.
const storage = multer.memoryStorage();

// fileFilter runs before the file is stored.
// Return cb(null, true) to accept the file or cb(new Error(...)) to reject it.
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // accept: jpeg, png, webp, etc.
  } else {
    cb(new Error("Only image files are allowed")); // reject: pdf, mp4, etc.
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB — protects the server from oversized uploads
  },
});
