'use client';

import { useState } from 'react';
import LeadListing from '@/components/LeadListing';
import LeadDetails from '@/components/LeadDetails';
import LeadManagement from '@/components/LeadManagement';
import KanbanBoard from '@/components/KanbanBoard';
import Dashboard from '@/components/Dashboard';
import CSVImport from '@/components/CSVImport';
import { Lead } from '@/lib/types';
import { mockLeads } from '@/lib/mockData';
import { Upload } from 'lucide-react';

export default function Home() {
  const [currentView, setCurrentView] = useState<'listing' | 'management' | 'kanban' | 'dashboard'>('listing');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const handleLeadUpdate = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-lg">LF</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                LeadFlow
              </h1>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setCurrentView('listing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'listing'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lead Listing
              </button>
              <button
                onClick={() => setCurrentView('management')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'management'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Leads
              </button>
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'kanban'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban View
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentView === 'dashboard'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCSVImport(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/25 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">HSR Motors</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto">
        {currentView === 'listing' && (
          <div className="flex">
            <div className={`flex-1 ${selectedLead ? 'mr-[400px]' : ''}`}>
              <LeadListing
                leads={leads}
                onLeadSelect={setSelectedLead}
                onLeadUpdate={handleLeadUpdate}
              />
            </div>
            {selectedLead && (
              <div className="fixed right-0 top-[60px] bottom-0 w-[400px] bg-white border-l border-gray-200 overflow-y-auto">
                <LeadDetails
                  lead={selectedLead}
                  onClose={() => setSelectedLead(null)}
                  onUpdate={handleLeadUpdate}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'management' && (
          <LeadManagement
            leads={leads}
            onLeadUpdate={handleLeadUpdate}
            onLeadSelect={setSelectedLead}
          />
        )}

        {currentView === 'kanban' && (
          <KanbanBoard
            leads={leads}
            onLeadUpdate={handleLeadUpdate}
            onLeadSelect={setSelectedLead}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard leads={leads} />
        )}
      </main>

      {showCSVImport && (
        <CSVImport
          onImport={(importedLeads) => {
            // Generate IDs for imported leads
            const leadsWithIds = importedLeads.map((lead, index) => ({
              ...lead,
              id: `imported-${Date.now()}-${index}`,
            }));
            setLeads(prev => [...prev, ...leadsWithIds]);
            setShowCSVImport(false);
          }}
          onClose={() => setShowCSVImport(false)}
        />
      )}
    </div>
  );
}

