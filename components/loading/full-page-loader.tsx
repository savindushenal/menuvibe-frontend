import { Spinner } from './spinner';
import { cn } from '@/lib/utils';

interface FullPageLoaderProps {
  message?: string;
  className?: string;
}

export function FullPageLoader({ message = 'Loading...', className }: FullPageLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <p className="text-lg font-medium text-neutral-700">{message}</p>
        )}
      </div>
    </div>
  );
}

interface OverlayLoaderProps {
  message?: string;
  show: boolean;
}

export function OverlayLoader({ message, show }: OverlayLoaderProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && (
          <p className="text-sm font-medium text-neutral-700">{message}</p>
        )}
      </div>
    </div>
  );
}

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineLoader({ message = 'Loading...', size = 'md' }: InlineLoaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Spinner size={size} />
      <span className="text-sm text-neutral-600">{message}</span>
    </div>
  );
}
