import { ResetPasswordForm } from "@/src/features/auth/components/ResetPasswordForm";

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-xl backdrop-blur-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
