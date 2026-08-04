import { Loader2 } from 'lucide-react';

export default function ToolLoading() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm max-w-md my-2 animate-pulse select-none">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Website Metadata Tool</h4>
        <p className="text-sm text-slate-700 mt-0.5">Preparing to fetch webpage...</p>
      </div>
    </div>
  );
}
