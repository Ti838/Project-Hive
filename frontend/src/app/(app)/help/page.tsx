'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  HelpCircle, MessageSquare, PlusCircle, Search, 
  ChevronRight, ArrowLeft, Send, Clock, CheckCircle2, 
  AlertCircle, Shield, LifeBuoy, FileQuestion, BookOpen
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const CATEGORIES = [
  'Account & Security',
  'Squads & Team Formation',
  'Academic Mesh & Sprints',
  'Video & Audio Calling',
  'HiveMind AI Studio',
  'Projects & Showcase',
  'Bug Reports',
  'Other Inquiries'
];

export default function HelpCenterPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets' | 'new'>('faq');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for new ticket
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetchUserTickets();
    }
  }, [activeTab]);

  const fetchUserTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.support.getMyTickets();
      if (res && res.tickets) {
        setTickets(res.tickets);
      }
    } catch (err) {
      console.warn('Could not fetch tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    setIsSubmitting(true);
    try {
      const res = await api.support.createTicket({
        subject,
        category,
        description,
        priority
      });
      if (res && res.ticket) {
        setSubmitSuccess(true);
        setSubject('');
        setDescription('');
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('tickets');
          fetchUserTickets();
        }, 1200);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const res = await api.support.replyTicket(selectedTicket.id, replyText);
      if (res && res.message) {
        setSelectedTicket({
          ...selectedTicket,
          status: 'Waiting for Admin',
          messages: [...(selectedTicket.messages || []), res.message]
        });
        setReplyText('');
      }
    } catch (err) {
      console.error('Error replying:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-mono text-xs uppercase tracking-wider mb-1">
            <LifeBuoy className="w-4 h-4" />
            <span>ProjectHive Support & Helpline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">How can we assist you?</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect directly with system administrators, submit bug reports, or browse campus collaboration guides.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-lg border border-border/60 self-start md:self-auto">
          <button
            onClick={() => { setActiveTab('faq'); setSelectedTicket(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'faq' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Knowledge Base & FAQ
          </button>
          <button
            onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'tickets' ? 'bg-background shadow-xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => { setActiveTab('new'); setSelectedTicket(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'new' ? 'bg-indigo-600 text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            + Submit Request
          </button>
        </div>
      </div>

      {/* ── TAB 1: FAQ / KNOWLEDGE BASE ── */}
      {activeTab === 'faq' && (
        <div className="space-y-8">
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search help topics, LiveKit calling, academic milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border/80 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/60 bg-card hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <span>How do Academic Sprints & Turn-ins work?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Team leaders tag course codes (e.g. CSE470) on squads. Members can click &quot;Turn In&quot; under the Classwork tab to submit GitHub branches, reports, or demo URLs before sprint deadlines.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-indigo-400">
                <Shield className="w-4 h-4" />
                <span>Is my LiveKit video or audio recorded?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No. All media streams are transmitted using end-to-end WebRTC dynamic SFU routing through isolated room keys. Media is never stored or recorded without prior consent.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-indigo-400">
                <HelpCircle className="w-4 h-4" />
                <span>How do I get verified developer badges?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your GitHub profile, LeetCode username, or Google Scholar ID under Profile Edit. The system automatically fetches your public statistics and adds verified tiers.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-border/60 bg-card hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-2 font-semibold text-sm mb-2 text-indigo-400">
                <MessageSquare className="w-4 h-4" />
                <span>How fast do administrators reply to tickets?</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our administrator reviews the inbox actively during university business hours. Urgent reports (security/access lockouts) receive priority attention within 2 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MY TICKETS LIST & DETAIL ── */}
      {activeTab === 'tickets' && !selectedTicket && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground font-mono">
              Loading support tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/60 rounded-xl p-6">
              <FileQuestion className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold text-sm">No Support Requests Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                You haven&apos;t opened any help inquiries yet. Click below if you have any questions or need technical support.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
              >
                Open First Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-card">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold">{t.ticket_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground font-medium">
                        {t.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        t.status === 'Open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        t.status === 'Waiting for Admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        t.status === 'Waiting for User' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{t.subject}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {Array.isArray(t.messages) && t.messages.length > 0
                        ? t.messages[t.messages.length - 1].content
                        : 'No messages yet'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2 DETAIL: INDIVIDUAL TICKET CONVERSATION ── */}
      {activeTab === 'tickets' && selectedTicket && (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedTicket(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Ticket Ledger</span>
          </button>

          <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
            {/* Header */}
            <div className="p-4 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-indigo-400">{selectedTicket.ticket_number}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{selectedTicket.category}</span>
                </div>
                <h2 className="text-base font-bold text-foreground mt-0.5">{selectedTicket.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-muted border border-border/60">
                  Priority: {selectedTicket.priority}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedTicket.status}
                </span>
              </div>
            </div>

            {/* Conversation Timeline */}
            <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto">
              {(selectedTicket.messages || []).map((msg: any) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 font-mono">
                      <span>{isAdmin ? 'System Administrator' : 'You'}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 rounded-xl max-w-lg text-xs leading-relaxed ${
                      isAdmin
                        ? 'bg-muted/80 text-foreground border border-border/60 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            {selectedTicket.status !== 'Closed' && (
              <div className="p-3 border-t border-border/60 bg-muted/10 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your reply to the administrator..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 px-3 py-2 text-xs bg-background border border-border/60 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: NEW TICKET FORM ── */}
      {activeTab === 'new' && (
        <div className="max-w-2xl border border-border/60 rounded-xl p-6 bg-card">
          <h2 className="text-lg font-bold mb-1">Create Support Request</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Describe your issue with as much detail as possible. A ticket number will be generated immediately.
          </p>

          {submitSuccess ? (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ticket dispatched successfully! Redirecting to conversation...</span>
            </div>
          ) : (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border/60 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Cannot access LiveKit room in CSE470 squad"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-background border border-border/60 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Detailed Description</label>
                <textarea
                  rows={5}
                  placeholder="Explain what steps caused the problem, error messages received, or questions for the admin..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-background border border-border/60 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
                <div className="flex items-center gap-3">
                  {['low', 'normal', 'urgent'].map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-xs cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={priority === p}
                        onChange={() => setPriority(p)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !subject || !description}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Dispatching Ticket...' : 'Submit Support Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

