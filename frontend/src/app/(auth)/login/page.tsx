import Link from "next/link";
import { LoginForm } from "@/src/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to your account to continue
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-xl backdrop-blur-sm">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="cursor-pointer font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
