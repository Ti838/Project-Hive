-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║         ProjectHive — LiveKit Calls & Real-Time Media Schema             ║
-- ║  Run this in: Supabase Dashboard → SQL Editor → New Query → Run         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- 1. Create Call Sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name VARCHAR(255) NOT NULL UNIQUE,
    call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('audio', 'video')),
    initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Call Participants table
CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (role IN ('initiator', 'participant')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(call_id, user_id)
);

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_initiator ON call_sessions(initiator_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_recipient ON call_sessions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_team ON call_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_room ON call_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_call_participants_call ON call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON call_participants(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow access to call records
CREATE POLICY "Allow all access to call sessions"
    ON call_sessions FOR ALL
    USING (true);

CREATE POLICY "Allow all access to call participants"
    ON call_participants FOR ALL
    USING (true);
