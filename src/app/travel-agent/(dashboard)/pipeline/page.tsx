'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Inbox, Phone, MapPin, Calendar, Flame, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  destination: string | null;
  travelDate: string | null;
  estimatedValue: number | null;
  quotedAmount: number | null;
  status: string;
  priority: string;
  nextFollowUp: string | null;
  createdAt: string;
}

const STAGES = [
  { id: 'NEW', label: 'New', color: 'border-blue-300 bg-blue-50' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-cyan-300 bg-cyan-50' },
  { id: 'INTERESTED', label: 'Interested', color: 'border-emerald-300 bg-emerald-50' },
  { id: 'QUOTED', label: 'Quoted', color: 'border-purple-300 bg-purple-50' },
  { id: 'NEGOTIATING', label: 'Negotiating', color: 'border-indigo-300 bg-indigo-50' },
  { id: 'BOOKED', label: 'Booked 🎉', color: 'border-green-400 bg-green-50' },
];

export default function PipelinePage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch up to 100 active leads (excludes LOST/COLD which clutter the board)
      const params = new URLSearchParams({ limit: '100' });
      const res = await fetch(`/api/travel-agent/leads?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const active = (json.leads as Lead[]).filter(
          (l) => !['LOST', 'COLD'].includes(l.status),
        );
        setLeads(active);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moveLead = async (leadId: string, newStatus: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic UI: update locally first, revert on failure
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));

    try {
      const res = await fetch(`/api/travel-agent/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setLeads(prev);
        showToast({ type: 'error', title: 'Failed to move lead' });
      }
    } catch {
      setLeads(prev);
      showToast({ type: 'error', title: 'Server error' });
    }
  };

  const onDragStart = (id: string) => setDraggingId(id);
  const onDragEnd = () => setDraggingId(null);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggingId) moveLead(draggingId, stageId);
    setDraggingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Board</h1>
          <p className="text-sm text-gray-500">
            Drag leads between stages to update status • {leads.length} active leads
          </p>
        </div>
        <Link
          href="/travel-agent/leads/add"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage.id);
              const stageValue = stageLeads.reduce(
                (sum, l) => sum + (l.quotedAmount || l.estimatedValue || 0),
                0,
              );
              return (
                <div
                  key={stage.id}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, stage.id)}
                  className={`w-72 shrink-0 rounded-2xl border-2 ${stage.color} flex flex-col`}
                >
                  <div className="p-3 border-b border-white/60">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800 text-sm">{stage.label}</p>
                      <span className="bg-white/90 text-xs font-bold px-2 py-0.5 rounded-full text-gray-700">
                        {stageLeads.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        ₹{stageValue.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[200px]">
                    {stageLeads.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">Drop leads here</p>
                    ) : (
                      stageLeads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/travel-agent/leads/${lead.id}`}
                          draggable
                          onDragStart={() => onDragStart(lead.id)}
                          onDragEnd={onDragEnd}
                          className={`block bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:border-emerald-300 transition-colors ${
                            draggingId === lead.id ? 'opacity-40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <p className="font-semibold text-gray-900 text-sm truncate">{lead.customerName}</p>
                            {lead.priority === 'HOT' && <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {lead.customerPhone}
                          </p>
                          {lead.destination && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5" /> {lead.destination}
                            </p>
                          )}
                          {lead.travelDate && (
                            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" /> {new Date(lead.travelDate).toLocaleDateString()}
                            </p>
                          )}
                          {(lead.quotedAmount || lead.estimatedValue) && (
                            <p className="text-xs font-bold text-emerald-700 mt-1.5">
                              ₹{(lead.quotedAmount || lead.estimatedValue || 0).toLocaleString('en-IN')}
                            </p>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Pipeline is empty</p>
          <p className="text-sm text-gray-400">Add leads to see them here</p>
        </div>
      )}
    </div>
  );
}
