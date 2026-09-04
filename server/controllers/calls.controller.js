// ─── ProjectHive — Calls Controller (LiveKit Session Management) ──────────────
import { supabaseAdmin } from '../config/supabase.js';
import { createLiveKitToken, getLiveKitServerUrl, formatRoomName } from '../services/livekit.service.js';

/**
 * Generate a LiveKit Access Token for Direct, Team, or Project Calls
 * POST /api/calls/token
 */
export async function getCallToken(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      scope = 'direct', // 'direct' | 'team' | 'project'
      targetId,        // target userId, teamId, or projectId
      callType = 'video', // 'audio' | 'video'
      roomName: clientRoomName,
    } = req.body;

    if (!targetId && !clientRoomName) {
      return res.status(400).json({ error: 'targetId or roomName is required' });
    }

    // Fetch caller user info
    const { data: callerUser, error: callerErr } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, avatar, avatar_color')
      .eq('id', userId)
      .single();

    if (callerErr || !callerUser) {
      return res.status(404).json({ error: 'Caller user record not found' });
    }

    const callerName = `${callerUser.first_name || ''} ${callerUser.last_name || ''}`.trim() || 'ProjectHive User';

    let roomName = clientRoomName;
    let teamId = null;
    let projectId = null;
    let targetUserId = null;

    // ── Authorization & Room Resolution ──────────────────────────────────────
    if (scope === 'direct') {
      targetUserId = targetId;
      if (targetUserId === userId) {
        return res.status(400).json({ error: 'Cannot start a call with yourself' });
      }

      if (!roomName) {
        roomName = formatRoomName('direct', userId, targetUserId);
      }
    } else if (scope === 'team') {
      teamId = targetId;

      // Verify caller is a member of the team
      const { data: member, error: memberErr } = await supabaseAdmin
        .from('team_members')
        .select('id, role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberErr || !member) {
        return res.status(403).json({ error: 'You must be a member of this team to join the call' });
      }

      if (!roomName) {
        roomName = formatRoomName('team', teamId);
      }
    } else if (scope === 'project') {
      projectId = targetId;

      // Verify caller is project owner or in project team
      const { data: project, error: projErr } = await supabaseAdmin
        .from('projects')
        .select('id, owner_id, team_id')
        .eq('id', projectId)
        .single();

      if (projErr || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      let authorized = project.owner_id === userId;
      if (!authorized && project.team_id) {
        const { data: tm } = await supabaseAdmin
          .from('team_members')
          .select('id')
          .eq('team_id', project.team_id)
          .eq('user_id', userId)
          .maybeSingle();
        if (tm) authorized = true;
      }

      if (!authorized) {
        return res.status(403).json({ error: 'You are not authorized to join this project call' });
      }

      if (!roomName) {
        roomName = formatRoomName('project', projectId);
      }
    } else {
      return res.status(400).json({ error: `Unsupported call scope: ${scope}` });
    }

    // ── Record Call in Database (Fail-Safe) ──────────────────────────────────
    try {
      await supabaseAdmin
        .from('calls')
        .upsert({
          room_name: roomName,
          caller_id: userId,
          call_type: callType,
          scope,
          team_id: teamId,
          project_id: projectId,
          target_user_id: targetUserId,
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'room_name' });
    } catch (dbErr) {
      console.warn('[Calls] Non-fatal error upserting call metadata:', dbErr.message);
    }

    // ── Generate LiveKit Access Token ────────────────────────────────────────
    const metadata = {
      id: callerUser.id,
      name: callerName,
      avatar: callerUser.avatar || null,
      avatar_color: callerUser.avatar_color || '#6366F1',
      callType,
      scope,
    };

    const token = await createLiveKitToken({
      identity: userId,
      name: callerName,
      roomName,
      metadata,
      canPublish: true,
      canSubscribe: true,
      ttl: '4h',
    });

    return res.json({
      success: true,
      token,
      roomName,
      livekitUrl: getLiveKitServerUrl(),
      callType,
      scope,
      caller: {
        id: callerUser.id,
        name: callerName,
        avatar: callerUser.avatar,
      },
    });
  } catch (err) {
    console.error('[Calls] Error generating LiveKit token:', err);
    return res.status(500).json({ error: 'Failed to generate call token', details: err.message });
  }
}

/**
 * End a Call and Update Duration Metadata
 * POST /api/calls/end
 */
export async function endCall(req, res) {
  try {
    const { roomName } = req.body;
    if (!roomName) {
      return res.status(400).json({ error: 'roomName is required' });
    }

    try {
      const { data: call } = await supabaseAdmin
        .from('calls')
        .select('id, started_at')
        .eq('room_name', roomName)
        .maybeSingle();

      if (call) {
        const started = new Date(call.started_at || Date.now()).getTime();
        const durationSeconds = Math.max(0, Math.round((Date.now() - started) / 1000));

        await supabaseAdmin
          .from('calls')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            duration_seconds: durationSeconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', call.id);
      }
    } catch (dbErr) {
      console.warn('[Calls] Non-fatal error ending call in DB:', dbErr.message);
    }

    return res.json({ success: true, message: 'Call ended successfully' });
  } catch (err) {
    console.error('[Calls] Error ending call:', err);
    return res.status(500).json({ error: 'Failed to end call' });
  }
}

/**
 * Get User Call History
 * GET /api/calls/history
 */
export async function getCallHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: calls, error } = await supabaseAdmin
      .from('calls')
      .select(`
        id, room_name, call_type, scope, status,
        started_at, ended_at, duration_seconds, created_at,
        caller:caller_id (id, first_name, last_name, avatar),
        target:target_user_id (id, first_name, last_name, avatar),
        team:team_id (id, name),
        project:project_id (id, title)
      `)
      .or(`caller_id.eq.${userId},target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('[Calls] Call history query notice:', error.message);
      return res.json({ success: true, calls: [] });
    }

    return res.json({ success: true, calls: calls || [] });
  } catch (err) {
    console.error('[Calls] Error fetching call history:', err);
    return res.status(500).json({ error: 'Failed to fetch call history' });
  }
}
