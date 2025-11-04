export type LeadStatus = 
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Test Drive Scheduled'
  | 'Negotiation'
  | 'Won'
  | 'Not Interested'
  | 'Invalid/Duplicate'
  | 'On Hold';

export type Channel = 'FB' | 'Twitter' | 'Google' | 'Website' | 'Offline';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ActivityType = 'Call' | 'Note' | 'Task' | 'Email' | 'WhatsApp' | 'Meeting' | 'Status Change';

export type CallDirection = 'Inbound' | 'Outbound';
export type CallOutcome = 'Connected' | 'No Answer' | 'Busy' | 'Voicemail' | 'Wrong Number';

export interface UTM {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  preferredModel?: string;
  budgetRange?: string;
  channel: Channel;
  utm?: UTM;
  owner: string;
  status: LeadStatus;
  priority: Priority;
  score: number;
  createdAt: Date;
  lastContactAt?: Date;
  nextActionAt?: Date;
  timezone?: string;
  isRepeatLead: boolean;
  duplicateOf?: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  createdAt: Date;
  createdBy: string;
  description?: string;
  // Call specific
  callDirection?: CallDirection;
  callOutcome?: CallOutcome;
  callDuration?: number; // seconds
  // Task specific
  taskDueDate?: Date;
  taskCompleted?: boolean;
  // Meeting specific
  meetingDate?: Date;
  meetingLocation?: string;
  // Status change specific
  statusFrom?: LeadStatus;
  statusTo?: LeadStatus;
  reasonCode?: string;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  description?: string;
  dueDate: Date;
  owner: string;
  completed: boolean;
  createdAt: Date;
}

export interface TestDrive {
  id: string;
  leadId: string;
  scheduledAt: Date;
  location: string;
  confirmed: boolean;
  reminderSent: boolean;
  noShow: boolean;
  completed: boolean;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  role: 'Sales Executive' | 'Business Manager';
  city?: string;
  expertise?: string[]; // Preferred models
}

export interface DashboardMetrics {
  leadsToday: number;
  firstContactUnder15m: number;
  firstContactUnder15mPercent: number;
  qualifiedPercent: number;
  wonCount: number;
  slaBreachCount: number;
  channelMix: Record<Channel, number>;
  statusFunnel: Record<LeadStatus, number>;
  ownerPerformance: Array<{
    ownerId: string;
    ownerName: string;
    calls: number;
    firstContactRate: number;
    qualifiedRate: number;
    wonCount: number;
  }>;
  topCampaigns: Array<{
    campaign: string;
    leads: number;
    cpl: number;
    cvr: number;
  }>;
}

