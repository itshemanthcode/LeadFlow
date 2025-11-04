'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead, LeadStatus } from '@/lib/types';
import { getStatusColor, checkSLABreach, getTimeAgo, cn } from '@/lib/utils';
import { mockOwners } from '@/lib/mockData';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadUpdate: (lead: Lead) => void;
  onLeadSelect: (lead: Lead) => void;
}

const statusColumns: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Test Drive Scheduled',
  'Negotiation',
  'Won',
];

interface SortableLeadCardProps {
  lead: Lead;
  onSelect: () => void;
}

function SortableLeadCard({ lead, onSelect }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const slaBreach = checkSLABreach(lead);
  const owner = mockOwners.find(o => o.id === lead.owner);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        'bg-white rounded-lg p-3 mb-2 shadow-sm cursor-pointer transition-all',
        isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1">{lead.name}</div>
          <div className="text-xs text-gray-600">{lead.city}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700">
            {lead.score}
          </span>
          {slaBreach && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
              SLA
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {lead.preferredModel || 'No model'} • {lead.budgetRange || 'No budget'}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={cn('px-2 py-0.5 rounded', getStatusColor(lead.status))}>
          {lead.status}
        </span>
        <span className="text-gray-500">
          {owner?.name || 'Unassigned'}
        </span>
      </div>
      {lead.nextActionAt && (
        <div className="mt-2 text-xs text-gray-500">
          Next: {getTimeAgo(lead.nextActionAt)}
        </div>
      )}
    </div>
  );
}

interface DroppableColumnProps {
  status: LeadStatus;
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}

function DroppableColumn({ status, leads, onSelect }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const leadIds = leads.map(l => l.id);

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{status}</h3>
          <span className="px-2 py-0.5 bg-white rounded text-sm font-medium text-gray-700">
            {leads.length}
          </span>
        </div>
      </div>
      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'min-h-[500px] rounded-lg p-2 transition-colors',
            isOver ? 'bg-primary-50' : 'bg-gray-100'
          )}
        >
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onSelect={() => onSelect(lead)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard({ leads, onLeadUpdate, onLeadSelect }: KanbanBoardProps) {
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const filteredLeads = leads.filter(lead => {
    if (filterOwner !== 'all' && lead.owner !== filterOwner) return false;
    if (filterCity !== 'all' && lead.city !== filterCity) return false;
    if (filterModel !== 'all' && lead.preferredModel !== filterModel) return false;
    return true;
  });

  const leadsByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = filteredLeads.filter(l => l.status === status);
    return acc;
  }, {} as Record<LeadStatus, Lead[]>);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    // Check if dragging to a different status column
    if (statusColumns.includes(newStatus)) {
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        onLeadUpdate({ ...lead, status: newStatus });
      }
    }
  };

  const cities = Array.from(new Set(leads.map(l => l.city)));
  const models = Array.from(new Set(leads.map(l => l.preferredModel).filter(Boolean)));

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Owner:</label>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            {mockOwners.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">City:</label>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Model:</label>
          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All</option>
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded"
          />
          SLA Breach Only
        </label>
      </div>

      {/* Kanban Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              leads={leadsByStatus[status] || []}
              onSelect={onLeadSelect}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
