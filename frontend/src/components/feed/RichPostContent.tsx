'use client';

import { useState, useMemo } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { sanitizeAndDecodeText } from '@/lib/utils';

interface RichPostContentProps {
  content: string;
  maxCharacters?: number;
  className?: string;
}

export function RichPostContent({
  content,
  maxCharacters = 280,
  className = '',
}: RichPostContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const decoded = useMemo(() => sanitizeAndDecodeText(content), [content]);

  const shouldTruncate = decoded.length > maxCharacters || (decoded.match(/\n/g) || []).length > 4;

  const displayedText = useMemo(() => {
    if (!shouldTruncate || isExpanded) return decoded;
    return decoded.slice(0, maxCharacters).trim() + '…';
  }, [decoded, shouldTruncate, isExpanded, maxCharacters]);

  // Extract first URL for optional rich link card
  const detectedUrl = useMemo(() => {
    const match = decoded.match(/https?:\/\/[^\s]+/i);
    return match ? match[0] : null;
  }, [decoded]);

  const formattedElements = useMemo(() => {
    // Regex for URLs, #hashtags, and @mentions
    const tokenRegex = /(https?:\/\/[^\s]+|#[a-zA-Z0-9_\u00C0-\u024F]+|@[a-zA-Z0-9_]+)/g;
    const parts = displayedText.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. URL match
      if (part.startsWith('http://') || part.startsWith('https://')) {
        let domain = part;
        try {
          domain = new URL(part).hostname.replace(/^www\./, '');
        } catch (_) {}

        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline font-medium break-all inline-flex items-center gap-0.5 mx-0.5"
          >
            <span>{part.length > 35 ? domain + '/…' : part}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
          </a>
        );
      }

      // 2. Hashtag match (#project, #hackathon2026)
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span
            key={index}
            className="text-primary hover:underline font-semibold cursor-pointer inline-block mx-0.5"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {part}
          </span>
        );
      }

      // 3. Mention match (@username)
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span
            key={index}
            className="text-amber-500 dark:text-amber-400 font-semibold hover:underline cursor-pointer inline-block mx-0.5"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {part}
          </span>
        );
      }

      // Plain text
      return <span key={index}>{part}</span>;
    });
  }, [displayedText]);

  return (
    <div className={`space-y-2.5 ${className}`}>
      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-foreground/95 tracking-tight break-words">
        {formattedElements}
        {shouldTruncate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-1.5 text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer focus:outline-none select-none inline-block align-baseline"
          >
            {isExpanded ? 'See less' : 'See more'}
          </button>
        )}
      </p>

      {/* Facebook-Style OpenGraph / Link Preview Card */}
      {detectedUrl && (
        <a
          href={detectedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 block rounded-2xl border border-white/10 dark:border-white/5 bg-muted/40 hover:bg-muted/70 transition-all overflow-hidden group shadow-xs"
        >
          <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {detectedUrl}
                </p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">
                  {(() => {
                    try {
                      return new URL(detectedUrl).hostname.replace(/^www\./, '');
                    } catch {
                      return 'External Link';
                    }
                  })()}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </a>
      )}
    </div>
  );
}

