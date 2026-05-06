import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Choose a strong password for your account.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-xl backdrop-blur-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
