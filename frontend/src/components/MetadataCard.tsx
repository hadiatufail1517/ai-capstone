import { Globe, User, Tag, ExternalLink } from 'lucide-react';

interface MetadataCardProps {
  url: string;
  metadata: {
    title: string;
    description: string;
    image: string | null;
    author: string | null;
    keywords: string[];
  };
}

export default function MetadataCard({ url, metadata }: MetadataCardProps) {
  const { title, description, image, author, keywords } = metadata;
  
  // Ensure url has protocol for href
  const hrefUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden my-3 hover:border-slate-300 transition-all duration-300">
      {/* OG Image banner if available */}
      {image && (
        <div className="relative w-full h-48 overflow-hidden bg-slate-100 border-b border-slate-200">
          <img 
            src={image} 
            alt={title || "Webpage Preview"} 
            className="w-full h-full object-cover opacity-90 hover:scale-102 transition-transform duration-500"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>Website Metadata</span>
          </div>
          <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
            {title || "Untitled Webpage"}
          </h3>
          <a 
            href={hrefUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors font-mono break-all mt-1"
          >
            <span>{url}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        {/* Footer info (Author & Keywords) */}
        {(author || (keywords && keywords.length > 0)) && (
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {/* Author */}
            {author && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Author: <strong className="text-slate-700">{author}</strong></span>
              </div>
            )}

            {/* Keywords */}
            {keywords && keywords.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {keywords.slice(0, 8).map((keyword, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
                    >
                      {keyword}
                    </span>
                  ))}
                  {keywords.length > 8 && (
                    <span className="text-[10px] text-slate-400 font-medium self-center">
                      +{keywords.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
