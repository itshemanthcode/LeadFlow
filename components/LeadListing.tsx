'use client';

import { useState, useMemo } from 'react';
import { Lead, LeadStatus, Priority } from '@/lib/types';
import { 
  formatPhone, 
  getStatusColor, 
  getPriorityColor, 
  getChannelColor,
  checkSLABreach,
  getTimeAgo,
  cn 
} from '@/lib/utils';
import { Phone, MessageSquare, Mail, FileText, ChevronDown, Search, Filter, MoreVertical } from 'lucide-react';
import { mockOwners } from '@/lib/mockData';

interface LeadListingProps {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
  onLeadUpdate: (lead: Lead) => void;
}

export default function LeadListing({ leads, onLeadSelect, onLeadUpdate }: LeadListingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'new' | 'sla' | 'testdrive'>('all');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Quick filters
    if (quickFilter === 'my') {
      filtered = filtered.filter(l => l.owner === '1'); // Current user
    } else if (quickFilter === 'new') {
      filtered = filtered.filter(l => l.status === 'New');
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      filtered = filtered.filter(l => l.createdAt > fifteenMinutesAgo);
    } else if (quickFilter === 'sla') {
      filtered = filtered.filter(l => checkSLABreach(l));
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.phone.includes(query) ||
        l.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [leads, quickFilter, searchQuery]);

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      onLeadUpdate({ ...lead, status: newStatus });
    }
  };

  const handleOwnerChange = (leadId: string, newOwnerId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      onLeadUpdate({ ...lead, owner: newOwnerId });
    }
  };

  const handleCall = (lead: Lead) => {
    // Simulate call - in real app, this would trigger phone integration
    console.log('Calling', lead.phone);
    // Auto-set to Contacted if call duration >= 30s (simulated)
    setTimeout(() => {
      if (lead.status === 'New') {
        handleStatusChange(lead.id, 'Contacted');
      }
    }, 100);
  };

  const handleWhatsApp = (lead: Lead) => {
    const message = `Hi ${lead.name.split(' ')[0]}, this is from HSR Motors. Saw your interest in ${lead.preferredModel || 'our vehicles'}. Can I help you?`;
    const url = `https://wa.me/${lead.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleEmail = (lead: Lead) => {
    if (!lead.email) {
      alert('No email address available for this lead');
      return;
    }
    const subject = `Your inquiry about ${lead.preferredModel || 'our vehicles'} - HSR Motors`;
    const body = `Dear ${lead.name},\n\nThank you for your interest. We'll be in touch shortly.\n\nBest regards,\nHSR Motors Team`;
    const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleAddNote = (lead: Lead) => {
    const note = prompt('Add a note for this lead:');
    if (note) {
      console.log('Note added:', note, 'for lead:', lead.id);
      // In real app, this would save the note via API
      alert('Note added successfully!');
    }
  };

  const handleBulkAssign = () => {
    if (selectedLeads.size === 0) return;
    const ownerId = prompt('Enter owner ID to assign (1, 2, or 3):');
    if (ownerId && mockOwners.find(o => o.id === ownerId)) {
      selectedLeads.forEach(leadId => {
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          handleOwnerChange(leadId, ownerId);
        }
      });
      setSelectedLeads(new Set());
      alert(`${selectedLeads.size} leads assigned successfully!`);
    }
  };

  const handleBulkStatusChange = () => {
    if (selectedLeads.size === 0) return;
    const newStatus = prompt('Enter new status (New, Contacted, Qualified, etc.):') as LeadStatus;
    if (newStatus && ['New', 'Contacted', 'Qualified', 'Test Drive Scheduled', 'Negotiation', 'Won', 'Not Interested', 'On Hold'].includes(newStatus)) {
      selectedLeads.forEach(leadId => {
        handleStatusChange(leadId, newStatus);
      });
      setSelectedLeads(new Set());
      alert(`${selectedLeads.size} leads updated successfully!`);
    }
  };

  const handleBulkExport = () => {
    if (selectedLeads.size === 0) return;
    const selectedLeadsData = leads.filter(l => selectedLeads.has(l.id));
    const csv = [
      ['Name', 'Phone', 'Email', 'City', 'Model', 'Budget', 'Channel', 'Status', 'Owner'].join(','),
      ...selectedLeadsData.map(lead => [
        lead.name,
        lead.phone,
        lead.email || '',
        lead.city,
        lead.preferredModel || '',
        lead.budgetRange || '',
        lead.channel,
        lead.status,
        mockOwners.find(o => o.id === lead.owner)?.name || '',
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setSelectedLeads(new Set());
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header with Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setQuickFilter('all')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              quickFilter === 'all'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            )}
          >
            All Leads
          </button>
          <button
            onClick={() => setQuickFilter('my')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              quickFilter === 'my'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            )}
          >
            My Leads
          </button>
          <button
            onClick={() => setQuickFilter('new')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              quickFilter === 'new'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            )}
          >
            New (&lt;15m)
          </button>
          <button
            onClick={() => setQuickFilter('sla')}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              quickFilter === 'sla'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/25'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
            )}
          >
            SLA Breach
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">City</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLeads.map((lead) => {
                const slaBreach = checkSLABreach(lead);
                const owner = mockOwners.find(o => o.id === lead.owner);
                
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent cursor-pointer transition-all duration-200 border-b border-gray-100"
                    onClick={() => onLeadSelect(lead)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedLeads(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(lead.id);
                            else next.delete(lead.id);
                            return next;
                          });
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{lead.name}</span>
                        {slaBreach && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm">
                            SLA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatPhone(lead.phone)}</td>
                    <td className="px-4 py-3 text-gray-700">{lead.city}</td>
                    <td className="px-4 py-3 text-gray-700">{lead.preferredModel || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{lead.budgetRange || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded', getChannelColor(lead.channel))}>
                        {lead.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded border-0',
                          getStatusColor(lead.status)
                        )}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Test Drive Scheduled">Test Drive Scheduled</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Won</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.owner}
                        onChange={(e) => handleOwnerChange(lead.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-gray-700 border border-gray-300 rounded px-2 py-1"
                      >
                        {mockOwners.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{lead.score}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{getTimeAgo(lead.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {lead.lastContactAt ? getTimeAgo(lead.lastContactAt) : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCall(lead)}
                          className="p-2 hover:bg-primary-50 rounded-lg transition-all duration-200 hover:scale-110 group"
                          title="Call"
                        >
                          <Phone className="w-4 h-4 text-gray-600 group-hover:text-primary-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWhatsApp(lead);
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110 group"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmail(lead);
                          }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110 group"
                          title="Email"
                        >
                          <Mail className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNote(lead);
                          }}
                          className="p-2 hover:bg-purple-50 rounded-lg transition-all duration-200 hover:scale-110 group"
                          title="Add Note"
                        >
                          <FileText className="w-4 h-4 text-gray-600 group-hover:text-purple-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No leads found matching your filters.
          </div>
        )}

        {/* Bulk Actions */}
        {selectedLeads.size > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedLeads.size} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkAssign}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white transition-colors"
              >
                Assign
              </button>
              <button
                onClick={handleBulkStatusChange}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white transition-colors"
              >
                Change Status
              </button>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-white transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

