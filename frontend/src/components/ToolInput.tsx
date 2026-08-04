import { Globe, RefreshCw } from 'lucide-react';

interface ToolInputProps {
  url: string;
}

export default function ToolInput({ url }: ToolInputProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm max-w-md my-2 select-none">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
        <Globe className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Website Metadata Tool</span>
          <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
        </h4>
        <p className="text-sm text-slate-700 mt-0.5 truncate">
          Fetching metadata for <span className="text-blue-600 font-medium underline break-all">{url}</span>
        </p>
      </div>
    </div>
  );
}
