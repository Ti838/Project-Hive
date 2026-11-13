'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Image as ImageIcon, Smile, Send, X } from 'lucide-react';
import { cn, timeAgo, getInitials, getAvatarColor, sanitizeAndDecodeText } from '@/lib/utils';

interface TeamChatTabProps {
  team: any;
  memberCount: number;
  messages: any[];
  user: any;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  imageAttachment: string | null;
  setImageAttachment: (val: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (val: boolean) => void;
  inputMessage: string;
  setInputMessage: React.Dispatch<React.SetStateAction<string>>;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  quickEmojis: string[];
}

export function TeamChatTab({
  team,
  memberCount,
  messages,
  user,
  messagesEndRef,
  imageAttachment,
  setImageAttachment,
  showEmojiPicker,
  setShowEmojiPicker,
  inputMessage,
  setInputMessage,
  handlePaste,
  handleSendMessage,
  fileInputRef,
  quickEmojis,
}: TeamChatTabProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs flex flex-col h-[600px]">
      {/* Chat Channel Header */}
      <div className="p-4 border-b border-border bg-card/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-bold text-xs text-foreground">
            {team.name.toLowerCase().replace(/\s+/g, '-')}-general
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Squad Real-Time Chat & Whiteboard Session
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono text-muted-foreground">
            {memberCount} members connected
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Welcome to the #{team.name} Channel!</p>
            <p className="text-xs max-w-sm">
              This is the start of your team&apos;s collaborative workspace. Share ideas, brainstorm, or drop meeting notes.
            </p>
          </div>
        ) : (
          messages.map((msg: any, idx) => {
            const isMe = msg.sender?.id === user?.id || msg.sender_id === user?.id;
            let parsedMedia: any = null;
            if (msg.content?.startsWith('{') && msg.content?.includes('"url"')) {
              try {
                parsedMedia = JSON.parse(msg.content);
              } catch (_) {}
            }

            return (
              <div key={msg.id || idx} className={cn('flex items-start gap-3 group', isMe && 'flex-row-reverse')}>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: msg.sender?.avatar_color || getAvatarColor(msg.sender?.id || 'x') }}
                >
                  {getInitials(`${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`)}
                </div>
                <div className={cn('max-w-md space-y-1', isMe && 'items-end')}>
                  <div className={cn('flex items-center gap-2 text-[10px] text-muted-foreground', isMe && 'justify-end')}>
                    <span className="font-semibold text-foreground">
                      {isMe ? 'You' : `${msg.sender?.first_name || 'Member'}`}
                    </span>
                    <span>{timeAgo(msg.createdAt || msg.created_at)}</span>
                  </div>

                  <div
                    className={cn(
                      'p-3 rounded-2xl text-xs leading-relaxed shadow-2xs break-words',
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card border border-border text-foreground rounded-tl-none'
                    )}
                  >
                    {parsedMedia ? (
                      <div className="space-y-2">
                        <img
                          src={parsedMedia.url}
                          alt="Attachment"
                          className="rounded-xl max-h-64 object-contain bg-background/10"
                        />
                        {parsedMedia.caption && <p>{parsedMedia.caption}</p>}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{sanitizeAndDecodeText(msg.content)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Attachment Preview */}
      {imageAttachment && (
        <div className="p-3 bg-muted/70 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={imageAttachment}
              alt="Preview"
              className="w-12 h-12 object-cover rounded-xl border border-border shadow-xs"
            />
            <span className="text-xs text-muted-foreground font-medium">Image ready to send</span>
          </div>
          <button
            onClick={() => setImageAttachment(null)}
            className="p-1 hover:bg-muted rounded-md text-muted-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsible Quick Emoji Drawer */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-t border-border bg-card/90 flex flex-wrap gap-1.5"
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setInputMessage((prev) => prev + emoji)}
                className="text-lg p-1.5 hover:bg-muted rounded-lg transition-transform hover:scale-125 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Composer */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => setImageAttachment(ev.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Attach Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            'p-2.5 rounded-xl hover:bg-muted transition-colors cursor-pointer',
            showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
          )}
          title="Emoji Picker"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPaste={handlePaste}
          placeholder="Message squad (supports Ctrl+V screenshot paste)…"
          className="flex-1 bg-muted/60 text-xs px-4 py-2.5 rounded-xl border border-transparent focus:border-primary focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() && !imageAttachment}
          className="p-2.5 bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

