

import type { Timestamp } from 'firebase/firestore'; // Keep for other parts if needed, but UserProfile will use Date

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  createdAt: Date; // Changed from Timestamp
  startDate?: Date; // Changed from Timestamp
  counterImage?: string;
  isAdmin?: boolean;
  isMuted?: boolean;
  commitmentDocument?: string;
  blockedUsers?: string[];
  emergencyIndex?: number;
  urgeIndex?: number;
  storyIndex?: number;
  role?: 'supervisor';
  journalEntries?: JournalEntry[];
  habits?: Habit[];
  followUpLogs?: { [key: string]: FollowUpLog };
  communityPostFireReactions?: Set<string>; // Added for guest users to track their reactions
}

export interface Message {
  id: string;
  text: string;
  timestamp: Timestamp;
  uid: string;
  displayName: string;
  photoURL: string;
  reactions?: { [key: string]: string[] };
  replyTo?: {
    id: string;
    text: string;
    displayName: string;
  };
}

export interface PinnedMessage {
    id: string;
    text: string;
    uid: string;
    displayName: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Timestamp;
}

export interface JournalEntry {
    id:string;
    text: string;
    mood: string;
    timestamp: Date;
}

export interface Conversation {
    uid: string;
    displayName: string;
    photoURL?: string;
    lastMessageTimestamp: Timestamp;
    hasUnread: boolean;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    type: 'public' | 'private';
    photoURL?: string;
    createdBy: string;
    createdAt: Timestamp;
    members: string[];
    supervisors?: string[];
    lastMessage?: string;
    lastMessageTimestamp?: Timestamp;
    unreadStatus?: { [key: string]: boolean };
    pinnedMessage?: PinnedMessage;
    joinRequests?: string[];
}

export interface Badge {
  days: number;
  name: string;
  icon: string;
  message?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  createdAt: Date;
  logs: { [date: string]: boolean };
  reminders?: string[];
}

export type FollowUpStatus = 'relapse' | 'slip_up' | 'success' | 'absent';

export interface FollowUpLog {
    // The ID will be the date string YYYY-MM-DD
    status: FollowUpStatus;
    timestamp: Date;
}


export type AlertType = 'success' | 'error';
export interface AlertContent {
  message: string;
  type: AlertType;
}

export interface Book {
  id: string;
  title: string;
  description?: string;
  coverUrl: string;
  fileUrl: string;
  uploaderUid: string;
  createdAt: Timestamp;
  categoryId?: string;
}

export interface LibraryCategory {
    id: string;
    name: string;
    createdAt: Timestamp;
}

export interface CommunityPost {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  createdAt: Date; // Use Date in client, Timestamp in Firestore
  isApproved: boolean;
  fireReactions?: string[]; // Array of UIDs
  developerFireCount?: number; // Added for developers to set arbitrary fire counts
}

export interface FreedomModelAudio {
  id: string;
  title: string;
  audioUrl: string;
  textContent: string; // New field for audio text content
  uploaderUid: string;
  createdAt: Timestamp;
}

// FIX: Added 'chat' to the Tab type to allow navigation to the chat screen.
export type Tab = 'home' | 'journal' | 'community-posts' | 'habits' | 'chat' | 'settings' | 'counter-settings' | 'follow-up' | 'library';

export interface LeaderboardEntry {
    user: UserProfile;
    days: number;
}