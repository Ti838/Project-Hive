import { sanitizeAndDecodeText } from '@/lib/utils';

export const REACTION_EMOJIS = ['❤️', '🔥', '🚀', '👍', '👏', '😂'];

export function renderReplySnippet(rawContent: string | null | undefined): {
  isMedia: boolean;
  mediaUrl?: string;
  label: string;
} {
  if (!rawContent) return { isMedia: false, label: '' };

  const trimmed = rawContent.trim();

  // Case 1: Raw JSON payload like {"type":"image","url":"data:image/..."}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'image' || parsed.url?.startsWith('data:image') || parsed.url?.startsWith('http')) {
        return {
          isMedia: true,
          mediaUrl: parsed.url,
          label: parsed.caption ? sanitizeAndDecodeText(parsed.caption) : '📷 Photo',
        };
      }
      if (parsed.type === 'voice') {
        return { isMedia: false, label: '🎤 Voice Note' };
      }
      if (parsed.type === 'file') {
        return {
          isMedia: false,
          label: `📎 ${parsed.name || 'Attachment'}`,
        };
      }
    } catch {
      // Fall through
    }
  }

  if (
    trimmed.startsWith('data:image') ||
    (trimmed.startsWith('http') &&
      (trimmed.includes('.png') ||
        trimmed.includes('.jpg') ||
        trimmed.includes('.jpeg') ||
        trimmed.includes('.webp')))
  ) {
    return { isMedia: true, mediaUrl: trimmed, label: '📷 Photo' };
  }

  if (trimmed.startsWith('data:audio')) {
    return { isMedia: false, label: '🎤 Voice Note' };
  }

  if (trimmed.startsWith('📞 Join my')) {
    return { isMedia: false, label: '📞 Meeting Invite' };
  }

  const cleaned = sanitizeAndDecodeText(trimmed);
  const truncated = cleaned.length > 60 ? cleaned.slice(0, 57) + '…' : cleaned;
  return { isMedia: false, label: truncated };
}

