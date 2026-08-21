'use client';

import React, { useState } from 'react';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Target,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Star,
  PhoneCall,
  ChevronDown,
  FileText,
  IndianRupee,
} from 'lucide-react';

// Mock leads data
const leadsData = [
  {
    id: 'L001',
    name: 'Rajesh Kumar',
    phone: '+91 9737965551',
    email: 'rajesh@email.com',
    source: 'Website',
    service: 'Bus Rental',
    requirement: 'Need 45-seater bus for wedding, 3 days',
    estimatedValue: 75000,
    status: 'hot',
    assignedTo: 'Suresh (Sales)',
    createdAt: '2024-01-15',
    lastContact: '2024-01-18',
    nextFollowUp: '2024-01-20',
    location: 'Mumbai',
    notes: [
      { date: '2024-01-18', note: 'Called, interested, will confirm by weekend' },
      { date: '2024-01-15', note: 'Initial inquiry via website form' },
    ],
  },
  {
    id: 'L002',
    name: 'Priya Sharma',
    phone: '+91 9737965551',
    email: 'priya.sharma@company.com',
    source: 'Referral',
    service: 'Corporate Cars',
    requirement: 'Monthly corporate car rental for 5 executives',
    estimatedValue: 150000,
    status: 'warm',
    assignedTo: 'Amit (Sales)',
    createdAt: '2024-01-14',
    lastContact: '2024-01-17',
    nextFollowUp: '2024-01-21',
    location: 'Pune',
    notes: [
      { date: '2024-01-17', note: 'Sent quotation, awaiting approval from management' },
    ],
  },
  {
    id: 'L003',
    name: 'Mohammed Ali',
    phone: '+91 97379 65551',
    email: 'mali@gmail.com',
    source: 'Google Ads',
    service: 'Packers & Movers',
    requirement: 'Relocating from Mumbai to Bangalore, 3BHK',
    estimatedValue: 45000,
    status: 'new',
    assignedTo: 'Unassigned',
    createdAt: '2024-01-18',
    lastContact: '2024-01-18',
    nextFollowUp: '2024-01-19',
    location: 'Mumbai',
    notes: [],
  },
  {
    id: 'L004',
    name: 'Sunita Patel',
    phone: '+91 97379 65551',
    email: 'sunita.p@email.com',
    source: 'Walk-in',
    service: 'Self-Drive Cars',
    requirement: 'Self-drive car for weekend trip to Lonavala',
    estimatedValue: 8000,
    status: 'cold',
    assignedTo: 'Suresh (Sales)',
    createdAt: '2024-01-10',
    lastContact: '2024-01-12',
    nextFollowUp: null,
    location: 'Mumbai',
    notes: [
      { date: '2024-01-12', note: 'Not interested right now, maybe next month' },
    ],
  },
  {
    id: 'L005',
    name: 'Tech Solutions Pvt Ltd',
    phone: '+91 97379 65551',
    email: 'transport@techsol.com',
    source: 'LinkedIn',
    service: 'Truck & Logistics',
    requirement: 'Regular goods transport Mumbai-Delhi route',
    estimatedValue: 200000,
    status: 'hot',
    assignedTo: 'Amit (Sales)',
    createdAt: '2024-01-16',
    lastContact: '2024-01-18',
    nextFollowUp: '2024-01-19',
    location: 'Mumbai',
    notes: [
      { date: '2024-01-18', note: 'Meeting scheduled for tomorrow' },
      { date: '2024-01-16', note: 'Contacted via LinkedIn, very interested' },
    ],
  },
  {
    id: 'L006',
    name: 'Arun Deshmukh',
    phone: '+91 97379 65551',
    email: 'arun.d@company.in',
    source: 'Phone Inquiry',
    service: 'Equipment Rental',
    requirement: 'JCB required for construction site, 1 month',
    estimatedValue: 120000,
    status: 'converted',
    assignedTo: 'Suresh (Sales)',
    createdAt: '2024-01-08',
    lastContact: '2024-01-15',
    nextFollowUp: null,
    location: 'Thane',
    notes: [
      { date: '2024-01-15', note: 'Booking confirmed! Invoice sent.' },
      { date: '2024-01-12', note: 'Negotiated price, agreed on ₹1.2L' },
    ],
  },
  {
    id: 'L007',
    name: 'Kavita Joshi',
    phone: '+91 97379 65551',
    email: 'kavita.j@email.com',
    source: 'Instagram',
    service: 'Luxury Cars',
    requirement: 'Luxury car for wedding with decoration',
    estimatedValue: 25000,
    status: 'lost',
    assignedTo: 'Amit (Sales)',
    createdAt: '2024-01-05',
    lastContact: '2024-01-10',
    nextFollowUp: null,
    location: 'Mumbai',
    notes: [
      { date: '2024-01-10', note: 'Went with competitor, price was lower' },
    ],
  },
];

const staffMembers = [
  { id: 1, name: 'Suresh (Sales)', role: 'Sales Executive' },
  { id: 2, name: 'Amit (Sales)', role: 'Sales Manager' },
  { id: 3, name: 'Pooja (Support)', role: 'Customer Support' },
];

const leadSources = ['Website', 'Google Ads', 'Referral', 'Walk-in', 'Phone Inquiry', 'Instagram', 'Facebook', 'LinkedIn', 'JustDial', 'Other'];
const services = ['Bus Rental', 'Tempo Traveller', 'Self-Drive Cars', 'Chauffeur Service', 'Luxury Cars', 'Packers & Movers', 'Truck & Logistics', 'Equipment Rental', 'Bike Rental'];

export default function LeadsPage() {
  const [leads, setLeads] = useState(leadsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<typeof leadsData[0] | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    service: '',
    requirement: '',
    estimatedValue: '',
    location: '',
    assignedTo: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cold': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'converted': return 'bg-green-100 text-green-700 border-green-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hot': return <Star className="w-3 h-3" />;
      case 'warm': return <TrendingUp className="w-3 h-3" />;
      case 'new': return <UserPlus className="w-3 h-3" />;
      case 'cold': return <AlertCircle className="w-3 h-3" />;
      case 'converted': return <CheckCircle className="w-3 h-3" />;
      case 'lost': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    hot: leads.filter(l => l.status === 'hot').length,
    warm: leads.filter(l => l.status === 'warm').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length,
    totalValue: leads.filter(l => !['lost', 'cold'].includes(l.status)).reduce((sum, l) => sum + l.estimatedValue, 0),
    conversionRate: Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100),
  };

  const todayFollowUps = leads.filter(l => l.nextFollowUp === '2024-01-19');

  const handleAddLead = () => {
    const lead = {
      id: `L${String(leads.length + 1).padStart(3, '0')}`,
      ...newLead,
      estimatedValue: Number(newLead.estimatedValue) || 0,
      status: 'new',
      createdAt: new Date().toISOString().split('T')[0],
      lastContact: new Date().toISOString().split('T')[0],
      nextFollowUp: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: [],
    };
    setLeads([lead, ...leads]);
    setShowAddModal(false);
    setNewLead({
      name: '', phone: '', email: '', source: '', service: '',
      requirement: '', estimatedValue: '', location: '', assignedTo: '',
    });
  };

  const pipelineStages = [
    { key: 'new', label: 'New Leads', color: 'blue' },
    { key: 'warm', label: 'Warm', color: 'orange' },
    { key: 'hot', label: 'Hot', color: 'red' },
    { key: 'converted', label: 'Converted', color: 'green' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600">Track and convert your leads</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <UserPlus className="w-4 h-4" />
            <span className="text-sm">New</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm">Hot Leads</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Converted</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Pipeline Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Conversion</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Today's Follow-ups */}
      {todayFollowUps.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <PhoneCall className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Today&apos;s Follow-ups ({todayFollowUps.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayFollowUps.map(lead => (
              <button
                key={lead.id}
                onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                className="px-3 py-1.5 bg-white border border-yellow-300 rounded-lg text-sm hover:bg-yellow-100 transition flex items-center gap-2"
              >
                <span className="font-medium">{lead.name}</span>
                <span className="text-yellow-600">→</span>
                <span className="text-gray-600">{lead.service}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sources</option>
            {leadSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`px-4 py-2 rounded-lg transition ${viewMode === 'pipeline' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Pipeline View
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Lead</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assigned To</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Next Follow-up</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lead.service}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.source}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">₹{lead.estimatedValue.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.assignedTo}</td>
                    <td className="px-4 py-3">
                      {lead.nextFollowUp ? (
                        <span className="text-sm text-gray-700">{lead.nextFollowUp}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4 text-gray-600" />
                        </button>
                        <a href={`tel:${lead.phone}`} className="p-2 hover:bg-green-100 rounded-lg transition" title="Call">
                          <Phone className="w-4 h-4 text-green-600" />
                        </a>
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" className="p-2 hover:bg-green-100 rounded-lg transition" title="WhatsApp">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pipelineStages.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.key);
            const stageValue = stageLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
            return (
              <div key={stage.key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${stage.color}-500`}></div>
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <span className="text-sm text-gray-500">({stageLeads.length})</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">₹{(stageValue / 1000).toFixed(0)}K</span>
                </div>
                <div className="space-y-3">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setShowLeadDetail(true); }}
                      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <span className="text-sm font-medium text-gray-700">₹{(lead.estimatedValue / 1000).toFixed(0)}K</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{lead.service}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{lead.source}</span>
                        {lead.nextFollowUp && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lead.nextFollowUp}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-center text-gray-400 py-4">No leads</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Lead</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 9737965551"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select source</option>
                    {leadSources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    value={newLead.service}
                    onChange={(e) => setNewLead({ ...newLead, service: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select service</option>
                    {services.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirement</label>
                <textarea
                  value={newLead.requirement}
                  onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="What does the customer need?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={newLead.estimatedValue}
                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Mumbai"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newLead.assignedTo}
                  onChange={(e) => setNewLead({ ...newLead, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLead}
                disabled={!newLead.name || !newLead.phone || !newLead.source || !newLead.service}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showLeadDetail && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                  <p className="text-gray-600">{selectedLead.service}</p>
                </div>
                <button onClick={() => setShowLeadDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status & Value */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedLead.status)}`}>
                  {getStatusIcon(selectedLead.status)}
                  {selectedLead.status.charAt(0).toUpperCase() + selectedLead.status.slice(1)}
                </span>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimated Value</p>
                  <p className="text-2xl font-bold text-gray-900">₹{selectedLead.estimatedValue.toLocaleString()}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">{selectedLead.phone}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline">{selectedLead.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{selectedLead.location}</span>
                </div>
              </div>

              {/* Requirement */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Requirement</h3>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedLead.requirement}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Source</p>
                  <p className="font-medium text-gray-900">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assigned To</p>
                  <p className="font-medium text-gray-900">{selectedLead.assignedTo}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">{selectedLead.createdAt}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Contact</p>
                  <p className="font-medium text-gray-900">{selectedLead.lastContact}</p>
                </div>
              </div>

              {/* Follow-up */}
              {selectedLead.nextFollowUp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Next Follow-up: {selectedLead.nextFollowUp}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Activity Notes</h3>
                <div className="space-y-3">
                  {selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((note, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <span className="text-gray-500 whitespace-nowrap">{note.date}</span>
                        <span className="text-gray-700">{note.note}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No notes yet</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Create Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
