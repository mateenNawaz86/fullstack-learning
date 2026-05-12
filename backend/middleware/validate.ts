import { z } from "zod"; // ZodSchema was deprecated in Zod v4; use z.ZodType instead
import { Request, Response, NextFunction } from "express";

// WHY a middleware instead of validating inside each controller?
// → DRY: one function handles validation for every route.
// → Separation of concerns: controllers only run when input is already clean.
// → Consistent error format: every 422 looks the same across the whole API.
//
// USAGE on a route:
//   router.post("/", validate(createCategorySchema), createCategory);
//   validate() runs first → if it passes, createCategory runs → if it fails, 422 is sent.

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // safeParse never throws — it always returns { success, data } or { success, error }
    // Use this instead of .parse() so we control the error response ourselves.
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // result.error.issues is Zod v4's array of validation failures.
      // Each issue has: path (which field), message (what's wrong), code (error type).
      const errors = result.error.issues.map((e) => ({
        field: e.path.join("."), // nested fields become "address.city" etc.
        message: e.message,
      }));

      res.status(422).json({ success: false, message: "Validation failed", errors });
      return; // stop here — controller never runs
    }

    // Replace req.body with Zod's parsed output.
    // This is important: Zod may have coerced types (e.g. "123" string → 123 number)
    // so from this point on req.body has the correct TypeScript types.
    req.body = result.data;
    next(); // validation passed → hand off to the controller
  };
