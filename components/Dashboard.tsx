'use client';

import { useState, useMemo } from 'react';
import { Lead, Channel, LeadStatus } from '@/lib/types';
import { getChannelColor, checkSLABreach, cn } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockDashboardMetrics, mockOwners } from '@/lib/mockData';
import { Calendar } from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
}

type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'custom';

export default function Dashboard({ leads }: DashboardProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const dateFilter = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'thisWeek':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const leadDate = new Date(lead.createdAt);
      return leadDate >= dateFilter.startDate && leadDate <= dateFilter.endDate;
    });
  }, [leads, dateFilter]);

  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const leadsToday = filteredLeads.filter(l => l.createdAt >= today);
    
    const newLeads = leadsToday.filter(l => l.status === 'New');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const contactedUnder15m = newLeads.filter(l => 
      l.lastContactAt && l.lastContactAt <= new Date(l.createdAt.getTime() + 15 * 60 * 1000)
    );
    
    const contacted = filteredLeads.filter(l => l.status === 'Contacted' || ['Qualified', 'Test Drive Scheduled', 'Negotiation', 'Won'].includes(l.status));
    const qualified = filteredLeads.filter(l => ['Qualified', 'Test Drive Scheduled', 'Negotiation', 'Won'].includes(l.status));
    const won = filteredLeads.filter(l => l.status === 'Won');
    const slaBreaches = filteredLeads.filter(l => checkSLABreach(l));

    const channelMix: Record<Channel, number> = {
      'FB': 0,
      'Twitter': 0,
      'Google': 0,
      'Website': 0,
      'Offline': 0,
    };
    filteredLeads.forEach(l => {
      if (channelMix[l.channel] !== undefined) {
        channelMix[l.channel]++;
      }
    });

    const statusFunnel: Record<LeadStatus, number> = {
      'New': 0,
      'Contacted': 0,
      'Qualified': 0,
      'Test Drive Scheduled': 0,
      'Negotiation': 0,
      'Won': 0,
      'Not Interested': 0,
      'Invalid/Duplicate': 0,
      'On Hold': 0,
    };
    filteredLeads.forEach(l => {
      if (statusFunnel[l.status] !== undefined) {
        statusFunnel[l.status]++;
      }
    });

    const ownerPerformance = mockOwners
      .filter(o => o.role === 'Sales Executive')
      .map(owner => {
        const ownerLeads = filteredLeads.filter(l => l.owner === owner.id);
        const calls = ownerLeads.filter(l => l.status !== 'New').length;
        const firstContact = ownerLeads.filter(l => 
          l.status !== 'New' && l.lastContactAt
        ).length;
        const qualified = ownerLeads.filter(l => 
          ['Qualified', 'Test Drive Scheduled', 'Negotiation', 'Won'].includes(l.status)
        ).length;
        const won = ownerLeads.filter(l => l.status === 'Won').length;

        return {
          ownerId: owner.id,
          ownerName: owner.name,
          calls,
          firstContactRate: ownerLeads.length > 0 ? Math.round((firstContact / ownerLeads.length) * 100) : 0,
          qualifiedRate: contacted.length > 0 ? Math.round((qualified / contacted.length) * 100) : 0,
          wonCount: won,
        };
      });

    return {
      leadsToday: leadsToday.length,
      firstContactUnder15m: contactedUnder15m.length,
      firstContactUnder15mPercent: newLeads.length > 0 
        ? Math.round((contactedUnder15m.length / newLeads.length) * 100) 
        : 0,
      qualifiedPercent: contacted.length > 0 
        ? Math.round((qualified.length / contacted.length) * 100) 
        : 0,
      wonCount: won.length,
      slaBreachCount: slaBreaches.length,
      channelMix,
      statusFunnel,
      ownerPerformance,
    };
  }, [filteredLeads]);

  const channelData = Object.entries(metrics.channelMix).map(([name, value]) => ({
    name,
    value,
  }));

  // Funnel data in order: New → Contacted → Qualified → Test Drive Scheduled → Negotiation → Won
  const funnelStages = [
    'New',
    'Contacted',
    'Qualified',
    'Test Drive Scheduled',
    'Negotiation',
    'Won',
  ];

  const funnelData = funnelStages.map((stage) => ({
    name: stage,
    value: metrics.statusFunnel[stage as LeadStatus] || 0,
  }));

  const maxValue = Math.max(...funnelData.map(d => d.value), 1);

  const COLORS = ['#0ea5e9', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <div className="p-6 space-y-6">
      {/* Date Range Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-soft">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Date Range:</span>
          </div>
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setDateRange('today')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                dateRange === 'today'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('thisWeek')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                dateRange === 'thisWeek'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('thisMonth')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                dateRange === 'thisMonth'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('thisQuarter')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                dateRange === 'thisQuarter'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              This Quarter
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                dateRange === 'custom'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Custom
            </button>
          </div>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Leads Today</div>
          <div className="text-3xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{metrics.leadsToday}</div>
        </div>
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">First Contact &lt;15m</div>
          <div className="text-3xl font-bold text-blue-600">
            {metrics.firstContactUnder15mPercent}%
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {metrics.firstContactUnder15m} of {metrics.leadsToday}
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl border border-green-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Qualified %</div>
          <div className="text-3xl font-bold text-green-600">{metrics.qualifiedPercent}%</div>
        </div>
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-200/50 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">Won</div>
          <div className="text-3xl font-bold text-purple-600">{metrics.wonCount}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl border border-red-200 p-6 shadow-soft card-hover group">
          <div className="text-sm text-gray-600 mb-2 font-medium">SLA Breach</div>
          <div className="text-3xl font-bold text-red-600">{metrics.slaBreachCount}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Channel Mix */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft card-hover">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            Channel Mix
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Funnel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft card-hover">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            Status Funnel
          </h3>
          <div className="relative" style={{ height: '450px' }}>
            <div className="flex flex-col items-center gap-0 h-full justify-center">
              {funnelData.map((stage, index) => {
                const widthPercent = (stage.value / maxValue) * 100;
                const prevValue = index > 0 ? funnelData[index - 1].value : maxValue;
                const conversionRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '0';
                const isFirst = index === 0;
                const isLast = index === funnelData.length - 1;
                const nextValue = !isLast ? funnelData[index + 1].value : 0;
                const nextWidthPercent = !isLast ? (nextValue / maxValue) * 100 : 0;
                
                // Color gradient from top to bottom
                const colors = [
                  { bg: 'from-blue-500 to-blue-600', light: 'from-blue-400/80 to-blue-500/80' },
                  { bg: 'from-blue-400 to-blue-500', light: 'from-blue-300/80 to-blue-400/80' },
                  { bg: 'from-green-400 to-green-500', light: 'from-green-300/80 to-green-400/80' },
                  { bg: 'from-yellow-400 to-yellow-500', light: 'from-yellow-300/80 to-yellow-400/80' },
                  { bg: 'from-orange-400 to-orange-500', light: 'from-orange-300/80 to-orange-400/80' },
                  { bg: 'from-purple-500 to-purple-600', light: 'from-purple-400/80 to-purple-500/80' },
                ];
                
                const color = colors[index] || colors[0];
                
                return (
                  <div key={stage.name} className="relative w-full flex flex-col items-center">
                    {/* Funnel Stage */}
                    <div
                      className="relative group transition-all duration-300 hover:scale-105"
                      style={{
                        width: `${Math.max(widthPercent, 20)}%`,
                        minWidth: '220px',
                      }}
                    >
                      <div
                        className={`w-full bg-gradient-to-r ${color.bg} rounded-t-lg shadow-xl border-2 border-white/30 p-5 relative overflow-hidden`}
                        style={{
                          minHeight: '55px',
                        }}
                      >
                        {/* Animated background shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-lg"></div>
                            <span className="font-bold text-white text-sm tracking-wide">{stage.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-xl">{stage.value}</span>
                            {!isFirst && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/25 text-white backdrop-blur-sm">
                                {conversionRate}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Funnel connector (trapezoid) */}
                      {!isLast && (
                        <div
                          className="relative"
                          style={{
                            width: '100%',
                            height: '20px',
                          }}
                        >
                          <div
                            className={`w-full h-full bg-gradient-to-b ${color.bg} ${color.light}`}
                            style={{
                              clipPath: `polygon(
                                0 0, 
                                100% 0, 
                                ${100 - ((widthPercent - nextWidthPercent) / 2 / widthPercent) * 100}% 100%, 
                                ${((widthPercent - nextWidthPercent) / 2 / widthPercent) * 100}% 100%
                              )`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend showing conversion rates */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                {funnelData.map((stage, index) => {
                  if (index === 0) return null;
                  const prevValue = funnelData[index - 1].value;
                  const conversionRate = prevValue > 0 ? ((stage.value / prevValue) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700">{funnelData[index - 1].name}</span>
                      <span className="text-primary-600 font-bold">→</span>
                      <span className="font-semibold text-gray-700">{stage.name}</span>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded font-medium">{conversionRate}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Performance */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
          Owner Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Calls</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">First Contact Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Qualified Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.ownerPerformance.map((perf) => (
                <tr key={perf.ownerId} className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent transition-all duration-200">
                  <td className="px-4 py-4 font-semibold text-gray-900">{perf.ownerName}</td>
                  <td className="px-4 py-4 text-gray-700 font-medium">{perf.calls}</td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      {perf.firstContactRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      {perf.qualifiedRate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                      {perf.wonCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
          Top Campaigns (UTM)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Leads</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">CPL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">CVR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockDashboardMetrics.topCampaigns.map((campaign, index) => (
                <tr key={index} className="hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent transition-all duration-200">
                  <td className="px-4 py-4 font-semibold text-gray-900">{campaign.campaign}</td>
                  <td className="px-4 py-4 text-gray-700 font-medium">{campaign.leads}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">₹{campaign.cpl}</td>
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                      {campaign.cvr}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

