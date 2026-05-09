'use client';

export function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return <div className={`skeleton ${width} ${height}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-surface-900/40 border border-surface-700/20 p-5 space-y-3">
      <SkeletonText width="w-1/3" height="h-4" />
      <SkeletonText width="w-full" height="h-3" />
      <SkeletonText width="w-2/3" height="h-3" />
    </div>
  );
}

export function SkeletonAvatar({ size = 'w-10 h-10' }) {
  return <div className={`skeleton rounded-full ${size}`} />;
}

export function SkeletonPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="w-10 h-10" />
        <div className="space-y-1.5">
          <SkeletonText width="w-40" height="h-4" />
          <SkeletonText width="w-24" height="h-3" />
        </div>
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-surface-700" />
        <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-surface-400 text-xs font-medium">{text}</p>
    </div>
  );
}
