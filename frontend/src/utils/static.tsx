import { TokenInvalidReason } from "../types/auth";

export const invalidReasonMessages: Record<
  TokenInvalidReason,
  { heading: string; body: string }
> = {
  used: {
    heading: "Link already used",
    body: "This password reset link has already been used. For your security, each link works only once.",
  },
  expired: {
    heading: "Link expired",
    body: "This password reset link has expired. Links are only valid for 10 minutes after they are sent.",
  },
  invalid: {
    heading: "Link invalid",
    body: "This password reset link is not recognised. It may have been copied incorrectly.",
  },
};
