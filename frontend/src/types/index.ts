
// ─── ProjectHive — Shared TypeScript Types ────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  avatar_color?: string;
  avatarColor?: string;
  banner?: string;
  banner_image?: string;
  bannerImage?: string;
  bio?: string;
  university?: string;
  department?: string;
  major?: string;
  student_id?: string;
  year_of_study?: number;
  yearOfStudy?: number;
  skills?: string[];
  interests?: string[];
  github?: string;
  github_url?: string;
  linkedin?: string;
  linkedin_url?: string;
  portfolio?: string;
  portfolio_url?: string;
  online_status?: 'online' | 'offline' | 'away';
  onlineStatus?: 'online' | 'offline' | 'away';
  last_seen?: string;
  lastSeen?: string;
  is_verified: boolean;
  isVerified?: boolean;
  is_banned?: boolean;
  isBanned?: boolean;
  role?: 'user' | 'admin' | 'student';
  profile_completion?: number;
  profileCompletion?: number;
  created_at: string;
  createdAt?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: 'recruiting' | 'active' | 'completed';
  leader_id: string;
  max_members?: number;
  required_skills?: string[];
  avatar?: string;
  avatar_color?: string;
  is_private?: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  has_pending_request?: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  user?: User;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  team_id?: string;
  creator_id: string;
  tech_stack?: string[];
  demo_url?: string;
  repo_url?: string;
  image_url?: string;
  is_featured?: boolean;
  likes_count?: number;
  is_liked?: boolean;
  created_at: string;
  creator?: User;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'system';
  read_by?: string[];
  reply_to?: string;
  reply_to_content?: string;
  reply_to_sender?: string;
  created_at: string;
  sender?: User;
  reactions?: Array<{ emoji: string; user_id: string }>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  type: 'update' | 'achievement' | 'poll' | 'project';
  images?: string[];
  poll_options?: PollOption[];
  mentions?: string[];
  created_at: string;
  author?: User;
  reactions?: PostReaction[];
  comments?: PostComment[];
  reaction_count?: number;
  comment_count?: number;
  user_reaction?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voted?: boolean;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  type: 'like' | 'celebrate' | 'support';
  user?: User;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: User;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: User;
  receiver?: User;
}

export interface Stats {
  users: number;
  teams: number;
  projects: number;
  universities: number;
}

export interface SocketMessage {
  id: string;
  content: string;
  type: string;
  sender: User;
  roomId: string;
  createdAt: string;
  reply_to?: string;
  reply_to_content?: string;
  reply_to_sender?: string;
}

export interface StatusUpdate {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export interface CallEvent {
  roomId: string;
  callerId?: string;
  callerName?: string;
  isWebRTC?: boolean;
  isVoiceOnly?: boolean;
  isGroup?: boolean;
  teamId?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  ok?: boolean;
}

// ─── Hive AI Unified Types ───────────────────────────────────────────────────

export type HiveAICapabilityType =
  | 'project_generator'
  | 'idea_analyzer'
  | 'project_critic'
  | 'research_assistant'
  | 'documentation_ai'
  | 'code_assistant'
  | 'architecture_design'
  | 'project_health'
  | 'team_ai'
  | 'career_ai'
  | 'copilot_chat';

export interface HiveAIContext {
  currentRoute?: string;
  projectId?: string;
  projectName?: string;
  teamId?: string;
  teamName?: string;
  techStack?: string[];
  userId?: string;
}

export interface HiveAIMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  capability?: HiveAICapabilityType;
  imageUrl?: string;
  provider?: string;
  model?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface HiveAIArtifactData {
  id: string;
  title: string;
  type: 'blueprint' | 'analysis' | 'critique' | 'docs' | 'code' | 'schema' | 'pitch';
  content: string;
  capability: HiveAICapabilityType;
  tags?: string[];
  createdAt: string;
}

