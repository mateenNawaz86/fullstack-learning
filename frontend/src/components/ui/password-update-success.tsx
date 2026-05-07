import Link from "next/link";

export const PasswordUpdateSuccess = () => {
  return (
    <div className="space-y-4 text-center">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Password updated
        </h1>
      </div>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
        <svg
          className="h-6 w-6 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-300">
        Your password has been reset successfully.
      </p>
      <Link
        href="/login"
        className="inline-block w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Sign in
      </Link>
    </div>
  );
};
