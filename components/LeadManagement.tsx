'use client';

import { useState, useMemo } from 'react';
import { Lead, Task } from '@/lib/types';
import { 
  getStatusColor, 
  getTimeAgo, 
  checkSLABreach,
  cn 
} from '@/lib/utils';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  Filter,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { mockOwners } from '@/lib/mockData';

interface LeadManagementProps {
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => void;
  onLeadSelect: (lead: Lead) => void;
}

export default function LeadManagement({ leads, onLeadSelect, onLeadUpdate }: LeadManagementProps) {
  const currentUserId = '1'; // In real app, get from auth context
  const [selectedSection, setSelectedSection] = useState<'queue' | 'followups' | 'tasks' | 'recent'>('queue');
  const [showTaskModal, setShowTaskModal] = useState(false);

  // My Leads Queue
  const myLeads = useMemo(() => {
    return leads
      .filter(l => l.owner === currentUserId)
      .sort((a, b) => {
        // Sort by priority and SLA breach
        const aSla = checkSLABreach(a);
        const bSla = checkSLABreach(b);
        if (aSla && !bSla) return -1;
        if (!aSla && bSla) return 1;
        
        // Then by score
        return b.score - a.score;
      });
  }, [leads, currentUserId]);

  // Today's Follow-ups
  const todayFollowUps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return myLeads.filter(lead => {
      if (!lead.nextActionAt) return false;
      const actionDate = new Date(lead.nextActionAt);
      return actionDate >= today && actionDate < tomorrow;
    });
  }, [myLeads]);

  // Overdue Tasks/Leads
  const overdueLeads = useMemo(() => {
    const now = new Date();
    return myLeads.filter(lead => {
      if (lead.nextActionAt) {
        return new Date(lead.nextActionAt) < now;
      }
      // Also include SLA breaches
      return checkSLABreach(lead);
    });
  }, [myLeads]);

  // Recently Assigned
  const recentlyAssigned = useMemo(() => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return myLeads
      .filter(l => l.createdAt >= oneWeekAgo)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }, [myLeads]);

  // Mock tasks (in real app, these would come from a tasks API)
  const tasks: Task[] = [
    {
      id: 't1',
      leadId: '1',
      title: 'Follow up with Riya S',
      description: 'Discuss Nexon pricing and features',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      owner: currentUserId,
      completed: false,
      createdAt: new Date(),
    },
    {
      id: 't2',
      leadId: '3',
      title: 'Send quote to Suma R',
      description: 'Harrier on-road price breakdown',
      dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Overdue
      owner: currentUserId,
      completed: false,
      createdAt: new Date(),
    },
  ];

  const activeTasks = tasks.filter(t => !t.completed);
  const overdueTasks = activeTasks.filter(t => new Date(t.dueDate) < new Date());

  const handleTaskComplete = (taskId: string) => {
    // In real app, update task via API
    console.log('Task completed:', taskId);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">My Leads</div>
          <div className="text-3xl font-bold text-blue-600 group-hover:scale-105 transition-transform">{myLeads.length}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border border-green-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Today's Follow-ups</div>
          <div className="text-3xl font-bold text-green-600 group-hover:scale-105 transition-transform">{todayFollowUps.length}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-200 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Overdue</div>
          <div className="text-3xl font-bold text-red-600 group-hover:scale-105 transition-transform">{overdueLeads.length}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Active Tasks</div>
          <div className="text-3xl font-bold text-purple-600 group-hover:scale-105 transition-transform">{activeTasks.length}</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setSelectedSection('queue')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            selectedSection === 'queue'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          My Leads Queue ({myLeads.length})
        </button>
        <button
          onClick={() => setSelectedSection('followups')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            selectedSection === 'followups'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Today's Follow-ups ({todayFollowUps.length})
        </button>
        <button
          onClick={() => setSelectedSection('tasks')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            selectedSection === 'tasks'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Tasks ({activeTasks.length})
        </button>
        <button
          onClick={() => setSelectedSection('recent')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
            selectedSection === 'recent'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Recently Assigned ({recentlyAssigned.length})
        </button>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-soft">
        {/* My Leads Queue */}
        {selectedSection === 'queue' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Leads Queue</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <div className="space-y-3">
              {myLeads.map((lead) => {
                const slaBreach = checkSLABreach(lead);
                const leadTask = tasks.find(t => t.leadId === lead.id && !t.completed);
                
                return (
                  <div
                    key={lead.id}
                    onClick={() => onLeadSelect(lead)}
                    className="p-5 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md card-hover"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{lead.name}</h3>
                          <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getStatusColor(lead.status))}>
                            {lead.status}
                          </span>
                          {slaBreach && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                              SLA Breach
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{lead.city} • {lead.preferredModel || 'No model'} • Score: {lead.score}</div>
                          {lead.nextActionAt && (
                            <div className="flex items-center gap-1 text-primary-600">
                              <Clock className="w-3 h-3" />
                              Next action: {getTimeAgo(lead.nextActionAt)}
                            </div>
                          )}
                          {leadTask && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="w-3 h-3" />
                              Task: {leadTask.title}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Call', lead.phone);
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Email', lead.email);
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title="Email"
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {myLeads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No leads assigned to you yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Follow-ups */}
        {selectedSection === 'followups' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Today's Follow-ups</h2>
              <p className="text-sm text-gray-600 mt-1">Leads that require follow-up action today</p>
            </div>
            <div className="space-y-3">
              {todayFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onLeadSelect(lead)}
                  className="p-4 border border-primary-200 bg-primary-50 rounded-lg hover:bg-primary-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <h3 className="font-medium text-gray-900">{lead.name}</h3>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getStatusColor(lead.status))}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {lead.city} • {lead.preferredModel || 'No model'}
                      </div>
                      {lead.nextActionAt && (
                        <div className="text-sm text-primary-700 mt-1">
                          Scheduled for: {lead.nextActionAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {todayFollowUps.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No follow-ups scheduled for today
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks */}
        {selectedSection === 'tasks' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
            
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Overdue ({overdueTasks.length})
                </h3>
                <div className="space-y-2">
                  {overdueTasks.map((task) => {
                    const lead = leads.find(l => l.id === task.leadId);
                    return (
                      <div
                        key={task.id}
                        className="p-4 border border-red-200 bg-red-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <span className="text-xs text-red-700">Overdue</span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            {lead && (
                              <div className="text-sm text-gray-600">
                                Lead: <button
                                  onClick={() => onLeadSelect(lead)}
                                  className="text-primary-600 hover:underline"
                                >
                                  {lead.name}
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">
                              Due: {getTimeAgo(task.dueDate)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleTaskComplete(task.id)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white"
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Tasks */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Tasks</h3>
              <div className="space-y-2">
                {activeTasks.filter(t => new Date(t.dueDate) >= new Date()).map((task) => {
                  const lead = leads.find(l => l.id === task.leadId);
                  return (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            onChange={() => handleTaskComplete(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            {lead && (
                              <div className="text-sm text-gray-600 mt-1">
                                Lead: <button
                                  onClick={() => onLeadSelect(lead)}
                                  className="text-primary-600 hover:underline"
                                >
                                  {lead.name}
                                </button>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {getTimeAgo(task.dueDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activeTasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No active tasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recently Assigned */}
        {selectedSection === 'recent' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recently Assigned Leads</h2>
              <p className="text-sm text-gray-600 mt-1">Leads assigned to you in the last 7 days</p>
            </div>
            <div className="space-y-3">
              {recentlyAssigned.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => onLeadSelect(lead)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{lead.name}</h3>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded', getStatusColor(lead.status))}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {lead.city} • {lead.preferredModel || 'No model'} • Score: {lead.score}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Assigned: {getTimeAgo(lead.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recentlyAssigned.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No recently assigned leads
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

