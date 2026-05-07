export const TokenCheckingSkeleton = () => {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Verifying link…">
      <div className="mb-6 space-y-2 text-center">
        <div className="mx-auto h-6 w-2/3 rounded bg-white/10" />
        <div className="mx-auto h-4 w-3/4 rounded bg-white/10" />
      </div>
      <div className="h-4 w-1/3 rounded bg-white/10" />
      <div className="h-10 rounded-lg bg-white/10" />
      <div className="h-4 w-1/3 rounded bg-white/10" />
      <div className="h-10 rounded-lg bg-white/10" />
      <div className="h-10 rounded-lg bg-white/10" />
    </div>
  );
};
