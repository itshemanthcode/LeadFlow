import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Lead, LeadStatus, Priority } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  // Mask phone number: show only last 4 digits
  if (phone.length <= 4) return phone;
  return '••••' + phone.slice(-4);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    'New': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-purple-100 text-purple-800',
    'Qualified': 'bg-green-100 text-green-800',
    'Test Drive Scheduled': 'bg-orange-100 text-orange-800',
    'Negotiation': 'bg-yellow-100 text-yellow-800',
    'Won': 'bg-emerald-100 text-emerald-800',
    'Not Interested': 'bg-gray-100 text-gray-800',
    'Invalid/Duplicate': 'bg-red-100 text-red-800',
    'On Hold': 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    'Low': 'bg-gray-100 text-gray-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700',
  };
  return colors[priority];
}

export function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    'FB': 'bg-blue-100 text-blue-800',
    'Twitter': 'bg-sky-100 text-sky-800',
    'Google': 'bg-red-100 text-red-800',
    'Website': 'bg-green-100 text-green-800',
    'Offline': 'bg-gray-100 text-gray-800',
  };
  return colors[channel] || 'bg-gray-100 text-gray-800';
}

export function calculateLeadScore(lead: Lead): number {
  let score = 0;
  
  // Channel weight
  const channelWeights: Record<string, number> = {
    'Website': 20,
    'Google': 18,
    'FB': 15,
    'Twitter': 12,
    'Offline': 10,
  };
  score += channelWeights[lead.channel] || 10;
  
  // Budget range
  if (lead.budgetRange) {
    const budget = lead.budgetRange.replace(/[^0-9]/g, '');
    if (budget.length > 0) {
      const budgetNum = parseInt(budget);
      if (budgetNum >= 1500000) score += 25;
      else if (budgetNum >= 1000000) score += 20;
      else if (budgetNum >= 800000) score += 15;
      else score += 10;
    }
  }
  
  // Model interest
  if (lead.preferredModel) score += 15;
  
  // Repeat lead
  if (lead.isRepeatLead) score += 20;
  
  // City (premium locations)
  const premiumCities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad'];
  if (premiumCities.includes(lead.city)) score += 10;
  
  return Math.min(100, score);
}

export function checkSLABreach(lead: Lead): boolean {
  const now = new Date();
  
  // New leads: no contact in 15 minutes
  if (lead.status === 'New') {
    const minutesSinceCreation = (now.getTime() - lead.createdAt.getTime()) / (1000 * 60);
    return minutesSinceCreation > 15 && !lead.lastContactAt;
  }
  
  // Other statuses: no follow-up in 24 hours
  if (lead.lastContactAt) {
    const hoursSinceLastContact = (now.getTime() - lead.lastContactAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastContact > 24;
  }
  
  return false;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function detectCityFromPhone(phone: string): string {
  // Simple prefix-based detection (can be enhanced)
  const prefix = phone.substring(0, 3);
  const cityMap: Record<string, string> = {
    '080': 'Bangalore',
    '022': 'Mumbai',
    '011': 'Delhi',
    '040': 'Hyderabad',
    '044': 'Chennai',
  };
  return cityMap[prefix] || 'Other';
}

export function suggestBestCallWindow(city: string): string {
  // Simple timezone-based suggestion
  const windows: Record<string, string> = {
    'Bangalore': '10 AM - 12 PM, 3 PM - 6 PM',
    'Mumbai': '10 AM - 12 PM, 3 PM - 6 PM',
    'Delhi': '10 AM - 12 PM, 3 PM - 6 PM',
    'Hyderabad': '10 AM - 12 PM, 3 PM - 6 PM',
    'Chennai': '10 AM - 12 PM, 3 PM - 6 PM',
  };
  return windows[city] || '10 AM - 6 PM';
}

