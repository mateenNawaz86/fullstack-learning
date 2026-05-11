import { v2 as cloudinary } from "cloudinary";

// Cloudinary is a cloud media platform. Free tier gives you 25GB storage + 25GB bandwidth/month.
// We configure it once here and reuse the same instance everywhere in the app.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// WHY upload_stream instead of uploader.upload(filePath)?
// → Multer is configured with memoryStorage(), so files live as a Buffer in RAM.
//   There is no file path to pass.
// → upload_stream accepts a writable stream, so we pipe the Buffer directly
//   to Cloudinary without ever writing a temp file to disk.
// → We wrap it in a Promise so callers can use async/await instead of callbacks.
export const uploadBuffer = (
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        // secure_url  → HTTPS URL you store in the DB and send to the frontend
        // public_id   → unique identifier needed later to DELETE the file
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer); // .end() writes the buffer into the stream and closes it
  });

// Deletes a previously uploaded file by its Cloudinary public_id.
// Called when a transaction is deleted or its receipt is replaced.
export const deleteFile = (publicId: string): Promise<void> =>
  cloudinary.uploader.destroy(publicId).then(() => undefined);

export default cloudinary;
