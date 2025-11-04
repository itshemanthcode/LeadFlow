import { Lead, Activity, Owner, DashboardMetrics, Channel, LeadStatus, Priority } from './types';
import { calculateLeadScore } from './utils';

export const mockOwners: Owner[] = [
  { id: '1', name: 'Ram Kumar', email: 'ram@hsrmotors.com', role: 'Sales Executive', city: 'Bangalore', expertise: ['Nexon', 'Tiago'] },
  { id: '2', name: 'Priya Sharma', email: 'priya@hsrmotors.com', role: 'Sales Executive', city: 'Bangalore', expertise: ['Punch', 'Harrier'] },
  { id: '3', name: 'Amit Patel', email: 'amit@hsrmotors.com', role: 'Business Manager', city: 'Bangalore', expertise: [] },
];

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Riya S',
    phone: '9876543210',
    email: 'riya@example.com',
    city: 'Bangalore',
    preferredModel: 'Nexon',
    budgetRange: '10–12L',
    channel: 'Google',
    utm: { source: 'google', medium: 'cpc', campaign: 'nexon_2024' },
    owner: '1',
    status: 'New',
    priority: 'High',
    score: 78,
    createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    isRepeatLead: false,
  },
  {
    id: '2',
    name: 'Ahmed K',
    phone: '9876543211',
    email: 'ahmed@example.com',
    city: 'Bangalore',
    preferredModel: 'Punch',
    budgetRange: '8–10L',
    channel: 'FB',
    owner: '2',
    status: 'Contacted',
    priority: 'Medium',
    score: 52,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastContactAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextActionAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    isRepeatLead: false,
  },
  {
    id: '3',
    name: 'Suma R',
    phone: '9876543212',
    email: 'suma@example.com',
    city: 'Mumbai',
    preferredModel: 'Harrier',
    budgetRange: '15–18L',
    channel: 'Website',
    owner: '1',
    status: 'Qualified',
    priority: 'High',
    score: 80,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isRepeatLead: true,
  },
  {
    id: '4',
    name: 'Ivan P',
    phone: '9876543213',
    email: 'ivan@example.com',
    city: 'Delhi',
    preferredModel: 'Nexon',
    budgetRange: '12–15L',
    channel: 'Twitter',
    owner: '1',
    status: 'Negotiation',
    priority: 'Urgent',
    score: 70,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    lastContactAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isRepeatLead: false,
  },
  {
    id: '5',
    name: 'Kiran M',
    phone: '9876543214',
    email: 'kiran@example.com',
    city: 'Hyderabad',
    preferredModel: 'Tiago',
    budgetRange: '6–8L',
    channel: 'Offline',
    owner: '2',
    status: 'New',
    priority: 'Low',
    score: 45,
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago - SLA breach
    isRepeatLead: false,
  },
];

// Recalculate scores for mock leads
mockLeads.forEach(lead => {
  lead.score = calculateLeadScore(lead);
});

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    leadId: '2',
    type: 'Call',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdBy: '2',
    callDirection: 'Outbound',
    callOutcome: 'Connected',
    callDuration: 45,
    description: 'Needs SUV; budget 12L',
  },
  {
    id: 'a2',
    leadId: '2',
    type: 'WhatsApp',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
    createdBy: '2',
    description: 'Template sent: Test drive intro',
  },
  {
    id: 'a3',
    leadId: '3',
    type: 'Status Change',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdBy: '1',
    statusFrom: 'Contacted',
    statusTo: 'Qualified',
    description: 'Qualified - Budget confirmed, model preferred',
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  leadsToday: 24,
  firstContactUnder15m: 18,
  firstContactUnder15mPercent: 75,
  qualifiedPercent: 42,
  wonCount: 8,
  slaBreachCount: 3,
  channelMix: {
    'Google': 8,
    'FB': 6,
    'Website': 5,
    'Twitter': 3,
    'Offline': 2,
  },
  statusFunnel: {
    'New': 8,
    'Contacted': 12,
    'Qualified': 6,
    'Test Drive Scheduled': 4,
    'Negotiation': 3,
    'Won': 8,
    'Not Interested': 5,
    'Invalid/Duplicate': 2,
    'On Hold': 1,
  },
  ownerPerformance: [
    {
      ownerId: '1',
      ownerName: 'Ram Kumar',
      calls: 45,
      firstContactRate: 82,
      qualifiedRate: 48,
      wonCount: 5,
    },
    {
      ownerId: '2',
      ownerName: 'Priya Sharma',
      calls: 38,
      firstContactRate: 78,
      qualifiedRate: 40,
      wonCount: 3,
    },
  ],
  topCampaigns: [
    { campaign: 'nexon_2024', leads: 15, cpl: 450, cvr: 12.5 },
    { campaign: 'punch_festival', leads: 10, cpl: 380, cvr: 15.0 },
    { campaign: 'harrier_luxury', leads: 8, cpl: 520, cvr: 10.0 },
  ],
};

