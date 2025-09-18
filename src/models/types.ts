// Core Data Types
export interface User {
  id: string;
  email: string;
  name: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  platform: SocialPlatform;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Lead {
  id: string;
  campaignId: string;
  email?: string;
  name?: string;
  company?: string;
  profileUrl?: string;
  status: LeadStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface Workflow {
  id: string;
  campaignId: string;
  name: string;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  username: string;
  isActive: boolean;
  credentials?: Record<string, any>;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum LeadStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONNECTED = 'connected',
  MESSAGED = 'messaged',
  REPLIED = 'replied',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum SocialPlatform {
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram'
}

// Configuration Types
export interface CampaignSettings {
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
    weekdays: number[]; // 0-6 (Sunday-Saturday)
  };
  rateLimiting: {
    maxConnectionsPerDay: number;
    maxMessagesPerDay: number;
    delayBetweenActions: number; // milliseconds
  };
  personalization: {
    useCustomMessages: boolean;
    messageTemplates: string[];
    includeCompanyInfo: boolean;
  };
}

export interface WorkflowSettings {
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  concurrency: number;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  config: Record<string, any>;
  order: number;
  conditions?: WorkflowCondition[];
}

export enum WorkflowStepType {
  CONNECT = 'connect',
  MESSAGE = 'message',
  FOLLOW_UP = 'follow_up',
  VIEW_PROFILE = 'view_profile',
  LIKE_POST = 'like_post',
  COMMENT = 'comment'
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

// API Request/Response Types
export interface CreateCampaignRequest {
  name: string;
  description?: string;
  platform: SocialPlatform;
  settings: CampaignSettings;
}

export interface CreateLeadRequest {
  email?: string;
  name?: string;
  company?: string;
  profileUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateWorkflowRequest {
  name: string;
  steps: WorkflowStep[];
  settings: WorkflowSettings;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Analytics Types
export interface CampaignAnalytics {
  campaignId: string;
  totalLeads: number;
  processedLeads: number;
  connectedLeads: number;
  messagedLeads: number;
  repliedLeads: number;
  failedLeads: number;
  successRate: number;
  averageResponseTime: number;
  conversionRate: number;
}

export interface LeadAnalytics {
  leadId: string;
  status: LeadStatus;
  processingTime: number;
  responseTime?: number;
  interactions: LeadInteraction[];
}

export interface LeadInteraction {
  type: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}
