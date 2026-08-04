import { AlertCircle, RotateCcw } from 'lucide-react';

interface ToolErrorProps {
  url: string;
  error: string;
  onRetry?: () => void;
}

export default function ToolError({ url, error, onRetry }: ToolErrorProps) {
  return (
    <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-4 my-2 flex gap-3 shadow-sm select-none">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 border border-red-200 text-red-600 shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Website Metadata Error</h4>
        <p className="text-xs text-red-800 mt-1">
          Failed to fetch metadata for <strong className="break-all">{url}</strong>
        </p>
        <p className="text-[11px] text-red-600 mt-1 italic break-words">
          {error}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 border border-red-300 text-xs text-red-700 font-medium transition-all cursor-pointer shadow-sm active:scale-97"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry Fetch</span>
          </button>
        )}
      </div>
    </div>
  );
}
