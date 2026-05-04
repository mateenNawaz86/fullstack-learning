import Link from "next/link";
import { RegisterForm } from "@/src/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Create an account
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Fill in the details below to get started
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-xl backdrop-blur-sm">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
