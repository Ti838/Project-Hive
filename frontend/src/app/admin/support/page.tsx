'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  User,
  ArrowLeft,
  Send,
  Lock,
  RefreshCw,
  FileText,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function AdminSupportCenterPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, open: 0, waitingAdmin: 0, resolved: 0 });
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.support.getAdminTickets({
        status: filterStatus,
        search: searchQuery,
      });
      if (res && res.tickets) {
        setTickets(res.tickets);
        if (selectedTicket) {
          const updatedSelected = res.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updatedSelected) setSelectedTicket(updatedSelected);
        }
      }
    } catch (err) {
      console.warn('Error fetching admin tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.support.getAdminStats();
      if (res) setStats(res);
    } catch (err) {
      console.warn('Error fetching support stats:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filterStatus]);

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      const res = await api.support.adminReply(selectedTicket.id, {
        content: replyText,
        isInternal: isInternalNote,
        newStatus: 'Waiting for User',
      });
      if (res && res.message) {
        setSelectedTicket({
          ...selectedTicket,
          status: isInternalNote ? selectedTicket.status : 'Waiting for User',
          messages: [...(selectedTicket.messages || []), res.message],
        });
        setReplyText('');
        fetchStats();
        fetchTickets();
      }
    } catch (err) {
      console.error('Error replying as admin:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      await api.support.updateAdminStatus(selectedTicket.id, {
        status: newStatus,
      });
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Top Telemetry & Controls Strip ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Support Helpline & Ticket Queue
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Two-way triage desk with internal staff notes and status escalation workflows.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-muted border border-border flex items-center gap-2 text-xs">
            <span className="text-muted-foreground text-[10px] uppercase font-mono">Total:</span>
            <span className="font-bold text-foreground font-mono">{stats.total || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <span className="text-[10px] uppercase font-mono">Waiting Staff:</span>
            <span className="font-mono">{stats.waitingAdmin || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <span className="text-[10px] uppercase font-mono">Resolved:</span>
            <span className="font-mono">{stats.resolved || 0}</span>
          </div>
          <button
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
            className="p-2 rounded-xl border border-input bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Refresh Tickets"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-primary', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ─── Main Two-Pane Split Layout (Android Adaptive / Slack Style) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left: Ticket Queue List (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-xs">
          {/* Filter Bar */}
          <div className="p-3 border-b border-border bg-muted/20 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['All', 'Open', 'Waiting for Admin', 'Waiting for User', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    filterStatus === st
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Fetching tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-xs">
                No tickets matching current filter.
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={cn(
                      'p-4 transition-colors cursor-pointer flex flex-col gap-1.5',
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-primary">
                        #{t.ticket_number || t.id.slice(0, 8)}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase',
                          t.status === 'Resolved'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : t.status === 'Waiting for Admin'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        )}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <span className="truncate">
                        From: {t.creator?.first_name ? `${t.creator.first_name} ${t.creator.last_name || ''}` : 'Student'}
                      </span>
                      <span className="font-mono">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Ticket Detail & Chat Pane (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-card border border-border overflow-hidden flex flex-col shadow-xs">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-xs">
                      #{selectedTicket.ticket_number || selectedTicket.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                      {selectedTicket.category || 'General'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground truncate mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-background border border-input text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Open">Open</option>
                    <option value="Waiting for Admin">Waiting for Admin</option>
                    <option value="Waiting for User">Waiting for User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[440px]">
                {/* Initial Description */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-bold text-foreground">
                      Original Request by {selectedTicket.creator?.first_name || 'User'}
                    </span>
                    <span className="font-mono">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{selectedTicket.description}</p>
                </div>

                {/* Threaded Replies */}
                {selectedTicket.messages?.map((m: any) => {
                  const isAdmin = m.is_admin || m.sender?.role === 'admin';
                  const isInternal = m.is_internal;

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'p-3.5 rounded-xl text-xs space-y-1',
                        isInternal
                          ? 'bg-amber-500/10 border border-amber-500/25'
                          : isAdmin
                          ? 'bg-primary/10 border border-primary/20 ml-6'
                          : 'bg-muted/40 border border-border mr-6'
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold flex items-center gap-1.5">
                          {isInternal && <Lock className="w-3 h-3 text-amber-500" />}
                          <span className={isInternal ? 'text-amber-600 dark:text-amber-400' : isAdmin ? 'text-primary' : 'text-foreground'}>
                            {isInternal ? 'Internal Staff Note' : isAdmin ? 'ProjectHive Staff' : m.sender?.first_name || 'Student'}
                          </span>
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed">{m.content}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Bar */}
              <div className="p-3 border-t border-border bg-muted/20 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Post as Internal Note (Hidden from user)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={isInternalNote ? 'Write internal note for staff...' : 'Type reply to user...'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminReply()}
                    className="flex-1 h-9 px-3 rounded-xl bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={handleAdminReply}
                    disabled={isSending || !replyText.trim()}
                    className={cn(
                      'h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs',
                      isInternalNote
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
              <MessageSquare className="w-10 h-10 opacity-30 text-primary" />
              <h4 className="text-sm font-bold text-foreground">No Ticket Selected</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Select a ticket from the left queue to review its history, reply, or update resolution status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
