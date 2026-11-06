'use client';

import React, { useState, useEffect } from 'react';
import { 
  Inbox, Search, Filter, MessageSquare, Clock, CheckCircle2, 
  AlertTriangle, Shield, User, ArrowLeft, Send, Tag, Lock, RefreshCw, FileText
} from 'lucide-react';
import { api } from '@/lib/api';

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

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filterStatus]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.support.getAdminTickets({
        status: filterStatus,
        search: searchQuery
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

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setIsSending(true);
    try {
      const res = await api.support.adminReply(selectedTicket.id, {
        content: replyText,
        isInternal: isInternalNote,
        newStatus: 'Waiting for User'
      });
      if (res && res.message) {
        setSelectedTicket({
          ...selectedTicket,
          status: isInternalNote ? selectedTicket.status : 'Waiting for User',
          messages: [...(selectedTicket.messages || []), res.message]
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
        status: newStatus
      });
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      fetchTickets();
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-200 font-mono text-xs p-6 space-y-6 select-none">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">SEC-OPS // HELPLINE CONTROL</div>
            <h1 className="text-base font-bold text-zinc-100">Enterprise Two-Way Support Center</h1>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center gap-2">
            <span className="text-zinc-500 text-[10px]">TOTAL:</span>
            <span className="font-bold text-zinc-200">{stats.total || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-amber-400 font-bold">
            <span className="text-[10px]">WAITING ADMIN:</span>
            <span>{stats.waitingAdmin || 0}</span>
          </div>
          <div className="px-3 py-1.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 font-bold">
            <span className="text-[10px]">RESOLVED:</span>
            <span>{stats.resolved || 0}</span>
          </div>
          <button
            onClick={() => { fetchTickets(); fetchStats(); }}
            className="p-1.5 rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split Console */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left: Ticket Queue */}
        <div className="col-span-12 lg:col-span-5 border border-zinc-800/80 rounded-lg bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter by subject or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-sm text-xs text-zinc-300 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2 py-1.5 text-xs text-zinc-300"
            >
              <option value="All">All States</option>
              <option value="Open">Open</option>
              <option value="Waiting for Admin">Waiting for Admin</option>
              <option value="Waiting for User">Waiting for User</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-12 text-zinc-600">Syncing support queue...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-800 rounded-sm p-4">
                No tickets matching current filters.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-sm border transition-all cursor-pointer ${
                    selectedTicket?.id === t.id
                      ? 'bg-zinc-800/90 border-indigo-500/80 shadow-xs'
                      : 'bg-zinc-950/60 border-zinc-800/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold text-indigo-400">{t.ticket_number}</span>
                    <span className={`px-1.5 py-0.2 rounded-xs font-bold ${
                      t.status === 'Waiting for Admin' ? 'bg-amber-500/20 text-amber-400' :
                      t.status === 'Open' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="font-bold text-zinc-200 text-xs line-clamp-1">{t.subject}</div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                    <span>{t.category}</span>
                    <span>{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Conversation & Customer Context */}
        <div className="col-span-12 lg:col-span-7 border border-zinc-800/80 rounded-lg bg-zinc-900/40 overflow-hidden flex flex-col min-h-[660px]">
          {selectedTicket ? (
            <>
              {/* Ticket Topbar */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="text-indigo-400 font-bold">{selectedTicket.ticket_number}</span>
                    <span>•</span>
                    <span>Category: {selectedTicket.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 mt-0.5">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 rounded-sm px-2 py-1 text-xs text-zinc-200 font-bold"
                  >
                    <option value="Open">Open</option>
                    <option value="Waiting for Admin">Waiting for Admin</option>
                    <option value="Waiting for User">Waiting for User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[460px]">
                {(selectedTicket.messages || []).map((msg: any) => {
                  const isAdmin = msg.sender_role === 'admin';
                  const isInternal = msg.is_internal;
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-sm border ${
                        isInternal
                          ? 'bg-amber-950/20 border-amber-600/40 text-amber-200'
                          : isAdmin
                          ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200 ml-6'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1 font-bold">
                        <span className={isAdmin ? 'text-indigo-400' : 'text-zinc-400'}>
                          {isInternal ? '🔒 INTERNAL PRIVATE NOTE' : isAdmin ? 'Administrator Response' : 'User Inquiry'}
                        </span>
                        <span className="text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-zinc-400">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded-xs text-amber-600"
                      />
                      <span>Make Private Internal Note (Invisible to User)</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={isInternalNote ? 'Write private investigation notes...' : 'Reply to user ticket...'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className={`flex-1 p-2.5 rounded-sm border text-xs text-zinc-200 focus:outline-hidden ${
                      isInternalNote
                        ? 'bg-amber-950/20 border-amber-500/40 focus:border-amber-500'
                        : 'bg-zinc-900 border-zinc-700 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    onClick={handleAdminReply}
                    disabled={isSending || !replyText.trim()}
                    className={`px-4 rounded-sm font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                      isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isInternalNote ? 'Log Note' : 'Reply'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-600">
              <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
              <div className="font-bold text-sm">No Ticket Selected</div>
              <p className="text-xs max-w-xs mt-1">Select an active support request from the queue to inspect context, view audit history, or issue a response.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

