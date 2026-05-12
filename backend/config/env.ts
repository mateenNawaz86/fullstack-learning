import dotenv from "dotenv";

// This module must be imported FIRST in index.ts.
// In CommonJS (how tsx compiles TypeScript), require() calls execute in order.
// Any module that reads process.env at load time (e.g. cloudinary.ts) will see
// undefined values unless dotenv.config() has already been called.
dotenv.config();
