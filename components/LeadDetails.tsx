'use client';

import { useState } from 'react';
import { Lead, Activity, LeadStatus } from '@/lib/types';
import { 
  formatPhone, 
  getStatusColor, 
  getChannelColor,
  getTimeAgo,
  formatDuration,
  cn 
} from '@/lib/utils';
import { X, Phone, MessageSquare, Mail, FileText, Calendar, Clock } from 'lucide-react';
import { mockActivities, mockOwners } from '@/lib/mockData';
import TestDriveScheduler from './TestDriveScheduler';

interface LeadDetailsProps {
  lead: Lead;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

export default function LeadDetails({ lead, onClose, onUpdate }: LeadDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'tasks' | 'communications'>('overview');
  const [showTestDriveScheduler, setShowTestDriveScheduler] = useState(false);
  const activities = mockActivities.filter(a => a.leadId === lead.id);
  const owner = mockOwners.find(o => o.id === lead.owner);

  const handleStatusChange = (newStatus: LeadStatus, reason?: string) => {
    if (['Not Interested', 'On Hold'].includes(newStatus) && !reason) {
      // In real app, show a modal for reason selection
      const reasonCode = prompt('Please provide a reason code:');
      if (!reasonCode) return;
    }
    onUpdate({ ...lead, status: newStatus });
  };

  const handleCall = () => {
    // Simulate call - auto-mark as Contacted if >= 30s
    console.log('Calling', lead.phone);
    setTimeout(() => {
      if (lead.status === 'New') {
        handleStatusChange('Contacted');
      }
    }, 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-start justify-between sticky top-0 bg-white z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">{lead.name}</h2>
            <span className={cn('px-2 py-1 text-xs font-medium rounded', getStatusColor(lead.status))}>
              {lead.status}
            </span>
            <span className="text-sm font-medium text-gray-700">Score: {lead.score}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Phone:</span> {formatPhone(lead.phone)}
            </div>
            <div>
              <span className="font-medium">Email:</span> {lead.email || '—'}
            </div>
            <div>
              <span className="font-medium">City:</span> {lead.city}
            </div>
            <div>
              <span className="font-medium">Channel:</span>{' '}
              <span className={cn('px-1.5 py-0.5 text-xs rounded', getChannelColor(lead.channel))}>
                {lead.channel}
              </span>
            </div>
            <div>
              <span className="font-medium">Model:</span> {lead.preferredModel || '—'}
            </div>
            <div>
              <span className="font-medium">Budget:</span> {lead.budgetRange || '—'}
            </div>
            <div>
              <span className="font-medium">Owner:</span> {owner?.name || 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Created:</span> {getTimeAgo(lead.createdAt)}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="border-b border-gray-200 p-4 flex items-center gap-2">
        <button
          onClick={handleCall}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Call
        </button>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </button>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Mail className="w-4 h-4" />
          Email
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'notes'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Notes
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tasks'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'communications'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          )}
        >
          Communications
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Activity Timeline */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Timeline</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5" />
                    <div className="w-px h-full bg-gray-200 min-h-[40px]" />
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                      <span className="text-xs text-gray-500">{getTimeAgo(activity.createdAt)}</span>
                    </div>
                    {activity.type === 'Call' && activity.callDuration && (
                      <div className="text-xs text-gray-600 mb-1">
                        Duration: {formatDuration(activity.callDuration)} |{' '}
                        {activity.callOutcome} | {activity.callDirection}
                      </div>
                    )}
                    {activity.description && (
                      <div className="text-sm text-gray-700">{activity.description}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No activities yet</div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Next Action</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  {lead.nextActionAt ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Follow-up scheduled for {getTimeAgo(lead.nextActionAt)}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No next action scheduled</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Test Drive Scheduler</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <button
                    onClick={() => setShowTestDriveScheduler(true)}
                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Test Drive
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <textarea
                placeholder="Add a note..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
              />
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Save Note
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Tasks</h4>
                <button className="text-sm text-primary-600 hover:text-primary-700">
                  + Add Task
                </button>
              </div>
              <div className="text-sm text-gray-500">No tasks yet</div>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500">Email and WhatsApp communications will appear here</div>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleStatusChange('Contacted')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white"
          >
            Mark Contacted
          </button>
          <button
            onClick={() => handleStatusChange('Qualified')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white"
          >
            Mark Qualified
          </button>
          <button
            onClick={() => handleStatusChange('Test Drive Scheduled')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white"
          >
            Schedule Test Drive
          </button>
          <button
            onClick={() => handleStatusChange('Won')}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mark Won
          </button>
        </div>
      </div>

      {showTestDriveScheduler && (
        <TestDriveScheduler
          lead={lead}
          onSchedule={(date, time, location) => {
            onUpdate({
              ...lead,
              status: 'Test Drive Scheduled',
              nextActionAt: date,
            });
            setShowTestDriveScheduler(false);
          }}
          onClose={() => setShowTestDriveScheduler(false)}
        />
      )}
    </div>
  );
}

