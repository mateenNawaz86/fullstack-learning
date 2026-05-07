import { TokenInvalidReason } from "@/src/types/auth";
import { invalidReasonMessages } from "@/src/utils/static";
import Link from "next/link";

export const TokenInvalidScreen = ({
  reason,
}: {
  reason: TokenInvalidReason;
}) => {
  const { heading, body } = invalidReasonMessages[reason];

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <svg
          className="h-6 w-6 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{heading}</p>
        <p className="text-sm text-gray-400">{body}</p>
      </div>

      <Link
        href="/forgot-password"
        className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950"
      >
        Request a new link
      </Link>
    </div>
  );
};
