import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AIToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
