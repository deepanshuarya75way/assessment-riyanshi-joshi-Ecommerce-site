import useHealthCheck from '../hooks/useHealthCheck.js';

const STATUS_CONFIG = {
  checking: {
    label: 'Checking...',
    dotClass: 'bg-amber-400 animate-pulse',
    textClass: 'text-amber-600',
    ringClass: 'border-amber-200 bg-amber-50',
  },
  connected: {
    label: 'Connected',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
    ringClass: 'border-emerald-200 bg-emerald-50',
  },
  disconnected: {
    label: 'Disconnected',
    dotClass: 'bg-red-500',
    textClass: 'text-red-600',
    ringClass: 'border-red-200 bg-red-50',
  },
};

export default function BackendStatus() {
  const status = useHealthCheck();
  const config = STATUS_CONFIG[status];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center py-6">
        <div
          role="status"
          aria-live="polite"
          className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium ${config.ringClass} ${config.textClass}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
          Backend Status: {config.label}
        </div>
      </div>
    </div>
  );
}
