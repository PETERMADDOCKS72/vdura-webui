import { useSystem } from '@/hooks/useSystem';
import { PageLoading } from '@/components/common/PageLoading';

export default function About() {
  const { data: system, isLoading } = useSystem();

  if (isLoading) return <PageLoading />;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-12 text-3xl font-bold">About PanActive Manager</h1>

      {/* VDURA Logo */}
      <div className="mb-8">
        <svg width="280" height="60" viewBox="0 0 280 60" fill="none">
          <text x="0" y="50" fill="#d4a017" fontFamily="system-ui" fontWeight="900" fontSize="56" fontStyle="italic">
            VDURA
          </text>
        </svg>
      </div>

      <div className="mb-6 space-y-1 text-center text-sm">
        <p>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Version: </span>
          <span>{system?.firmwareVersion ?? '8.6.1.0'}</span>
        </p>
        <p>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Customer ID: </span>
          <span>{system?.serialNumber ?? 'VD5K-2025-00482'}</span>
        </p>
      </div>

      <p className="mb-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        This product is protected by US and International Laws. Unauthorized reproduction or distribution
        of this program, or any portion of it, may result in severe civil and criminal penalties.
      </p>

      <p className="mb-6 text-center text-sm text-muted-foreground">
        Copyright 2025, <span className="text-vdura-amber">VDURA Inc.</span>
        <br />
        All rights reserved.
      </p>

      <div className="flex gap-8 text-sm">
        <span className="text-vdura-amber hover:underline cursor-pointer">Terms & Conditions</span>
        <span className="text-vdura-amber hover:underline cursor-pointer">Release Notes</span>
      </div>
    </div>
  );
}
