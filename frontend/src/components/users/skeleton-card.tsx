export const SekeletonCard = () => {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-5 py-4">
      <div className="size-10 animate-pulse rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-48 animate-pulse rounded bg-white/10" />
      </div>
      <div className="h-5 w-14 animate-pulse rounded-full bg-white/10" />
    </div>
  );
};
