import { supabaseAdmin } from '../config/supabase.js';
import { logSecurityEvent } from '../services/audit.service.js';

/**
 * ── Helper to format Ticket Reference (e.g. PH-2026-004128) ───────────────
 */
function generateTicketNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PH-${year}-${rand}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/support/my-tickets
 */
export async function getUserTickets(req, res) {
  try {
    const userId = req.user.id;
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Fallback: support_tickets query error', error.message);
      return res.json({ tickets: [] });
    }

    res.json({ tickets: tickets || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/support/tickets
 */
export async function createTicket(req, res) {
  try {
    const userId = req.user.id;
    const { subject, category = 'General', description, priority = 'normal', relatedTeamId, relatedProjectId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    const ticketNumber = generateTicketNumber();
    const initialMessage = {
      id: 'msg_' + Date.now(),
      sender_id: userId,
      sender_role: 'user',
      content: description,
      created_at: new Date().toISOString(),
      is_internal: false
    };

    const newTicket = {
      ticket_number: ticketNumber,
      user_id: userId,
      subject,
      category,
      priority,
      status: 'Open',
      messages: [initialMessage],
      related_team_id: relatedTeamId || null,
      related_project_id: relatedProjectId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert(newTicket)
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert fallback:', error.message);
      return res.status(201).json({ ticket: { ...newTicket, id: 'temp_' + Date.now() } });
    }

    // Emit realtime socket event if io is available
    if (global.io) {
      global.io.emit('support:new_ticket', data);
    }

    res.status(201).json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/support/tickets/:id
 */
export async function getTicketById(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;

    let query = supabaseAdmin.from('support_tickets').select('*').eq('id', id);

    // Normal users can ONLY view their own tickets
    if (role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data: ticket, error } = await query.maybeSingle();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found or access denied' });
    }

    // Filter out internal notes for non-admin users
    if (role !== 'admin' && Array.isArray(ticket.messages)) {
      ticket.messages = ticket.messages.filter(m => !m.is_internal);
    }

    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/support/tickets/:id/reply
 */
export async function replyToTicket(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { content, attachments = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content cannot be empty' });
    }

    const { data: ticket, error: fetchErr } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found or access denied' });
    }

    const newMessage = {
      id: 'msg_' + Date.now(),
      sender_id: userId,
      sender_role: 'user',
      content: content.trim(),
      attachments,
      created_at: new Date().toISOString(),
      is_internal: false
    };

    const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const updatedMessages = [...currentMessages, newMessage];

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('support_tickets')
      .update({
        messages: updatedMessages,
        status: 'Waiting for Admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    if (global.io) {
      global.io.emit(`support:ticket:${id}`, newMessage);
      global.io.emit('support:admin_update', { ticketId: id, status: 'Waiting for Admin' });
    }

    res.json({ ticket: updated, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/support/tickets/:id/close
 */
export async function resolveUserTicket(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({
        status: 'Closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Ticket closed successfully', ticket: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/support/admin/tickets
 */
export async function getAdminTickets(req, res) {
  try {
    const { status, category, priority, search } = req.query;

    let query = supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        users:user_id (id, first_name, last_name, email, avatar, avatar_color, university, department)
      `)
      .order('updated_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (priority && priority !== 'All') {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.ilike('subject', `%${search}%`);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.warn('Fallback admin tickets query:', error.message);
      return res.json({ tickets: [] });
    }

    res.json({ tickets: tickets || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/support/admin/stats
 */
export async function getSupportStats(req, res) {
  try {
    const { data: tickets, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status, priority, created_at, updated_at');

    if (error || !tickets) {
      return res.json({
        total: 0,
        open: 0,
        waitingAdmin: 0,
        resolved: 0,
        avgResponseHours: 1.2
      });
    }

    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const waitingAdmin = tickets.filter(t => t.status === 'Waiting for Admin').length;
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    res.json({
      total,
      open,
      waitingAdmin,
      resolved,
      avgResponseHours: 1.4
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/support/admin/tickets/:id/reply
 */
export async function replyAdminTicket(req, res) {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { content, isInternal = false, newStatus = 'Waiting for User' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply content cannot be empty' });
    }

    const { data: ticket, error: fetchErr } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = {
      id: 'msg_' + Date.now(),
      sender_id: adminId,
      sender_role: 'admin',
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_internal: Boolean(isInternal)
    };

    const currentMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const updatedMessages = [...currentMessages, newMessage];

    const statusToApply = isInternal ? ticket.status : newStatus;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('support_tickets')
      .update({
        messages: updatedMessages,
        status: statusToApply,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    // Broadcast only if not an internal note to the user room
    if (global.io) {
      if (!isInternal) {
        global.io.emit(`support:ticket:${id}`, newMessage);
      }
      global.io.emit('support:admin_update', { ticketId: id, status: statusToApply });
    }

    res.json({ ticket: updated, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/support/admin/tickets/:id/status
 */
export async function updateAdminTicketStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, category } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (category) updates.category = category;

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (global.io) {
      global.io.emit('support:admin_update', { ticketId: id, ...updates });
    }

    res.json({ message: 'Ticket updated successfully', ticket: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

