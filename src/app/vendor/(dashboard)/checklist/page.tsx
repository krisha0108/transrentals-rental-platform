'use client';

import React, { useState } from 'react';
import {
  ClipboardCheck,
  Car,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  ChevronRight,
  Fuel,
  Settings,
} from 'lucide-react';

// Pre-trip checklist items
const checklistItems = [
  { id: 'exterior', category: 'Exterior', items: [
    { id: 'body_damage', name: 'Body Damage Check', required: true },
    { id: 'tyres', name: 'Tyre Condition & Pressure', required: true },
    { id: 'lights', name: 'All Lights Working', required: true },
    { id: 'mirrors', name: 'Mirrors Clean & Adjusted', required: true },
    { id: 'wipers', name: 'Windshield Wipers Working', required: true },
    { id: 'wash', name: 'Vehicle Washed/Clean', required: false },
  ]},
  { id: 'interior', category: 'Interior', items: [
    { id: 'seats', name: 'Seats Clean & Undamaged', required: true },
    { id: 'ac', name: 'AC Working Properly', required: true },
    { id: 'dashboard', name: 'Dashboard Lights Normal', required: true },
    { id: 'horn', name: 'Horn Working', required: true },
    { id: 'music', name: 'Music System Working', required: false },
    { id: 'smell', name: 'No Bad Odors', required: false },
  ]},
  { id: 'documents', category: 'Documents', items: [
    { id: 'rc', name: 'RC Copy Present', required: true },
    { id: 'insurance', name: 'Insurance Copy Present', required: true },
    { id: 'puc', name: 'PUC Certificate Present', required: true },
    { id: 'permit', name: 'Permit (if applicable)', required: false },
  ]},
  { id: 'safety', category: 'Safety Equipment', items: [
    { id: 'first_aid', name: 'First Aid Kit', required: true },
    { id: 'fire_extinguisher', name: 'Fire Extinguisher', required: true },
    { id: 'spare_tyre', name: 'Spare Tyre & Tools', required: true },
    { id: 'reflector', name: 'Reflector Triangle', required: true },
  ]},
  { id: 'fuel', category: 'Fuel & Fluids', items: [
    { id: 'fuel_level', name: 'Fuel Level Adequate', required: true },
    { id: 'engine_oil', name: 'Engine Oil Level OK', required: true },
    { id: 'coolant', name: 'Coolant Level OK', required: true },
    { id: 'brake_fluid', name: 'Brake Fluid OK', required: false },
  ]},
];

// Mock completed checklists
const completedChecklists = [
  {
    id: 'CL001',
    vehicleId: 'MH04AB1234',
    vehicleName: 'Innova Crysta',
    driverName: 'Ramesh Singh',
    date: '2024-01-18',
    time: '07:30',
    tripType: 'Pre-Trip',
    status: 'passed',
    passedItems: 22,
    totalItems: 24,
    fuelLevel: 85,
    odometerReading: 45230,
    notes: 'All good, minor dust on dashboard',
    photos: 2,
  },
  {
    id: 'CL002',
    vehicleId: 'MH04CD5678',
    vehicleName: 'Swift Dzire',
    driverName: 'Suresh Patil',
    date: '2024-01-18',
    time: '05:15',
    tripType: 'Pre-Trip',
    status: 'passed',
    passedItems: 24,
    totalItems: 24,
    fuelLevel: 90,
    odometerReading: 78450,
    notes: '',
    photos: 3,
  },
  {
    id: 'CL003',
    vehicleId: 'MH04EF9012',
    vehicleName: '45 Seater Bus',
    driverName: 'Mohan Kumar',
    date: '2024-01-17',
    time: '06:45',
    tripType: 'Pre-Trip',
    status: 'issues',
    passedItems: 20,
    totalItems: 24,
    fuelLevel: 60,
    odometerReading: 125000,
    notes: 'Rear left tyre needs replacement, AC not cooling properly',
    photos: 4,
    issues: ['Rear left tyre wear', 'AC performance issue'],
  },
  {
    id: 'CL004',
    vehicleId: 'MH04AB1234',
    vehicleName: 'Innova Crysta',
    driverName: 'Ramesh Singh',
    date: '2024-01-17',
    time: '19:30',
    tripType: 'Post-Trip',
    status: 'passed',
    passedItems: 22,
    totalItems: 22,
    fuelLevel: 25,
    odometerReading: 45380,
    notes: 'Trip completed successfully',
    photos: 2,
  },
  {
    id: 'CL005',
    vehicleId: 'MH04GH3456',
    vehicleName: 'Ertiga',
    driverName: 'Vijay Sharma',
    date: '2024-01-17',
    time: '08:00',
    tripType: 'Pre-Trip',
    status: 'passed',
    passedItems: 23,
    totalItems: 24,
    fuelLevel: 70,
    odometerReading: 32100,
    notes: 'Music system has minor issue',
    photos: 2,
  },
];

// Pending checklists for today
const pendingToday = [
  { id: 1, vehicleId: 'MH04IJ7890', vehicleName: 'Mercedes E-Class', bookingTime: '16:00', driverName: 'Vijay Sharma' },
  { id: 2, vehicleId: 'MH04KL2345', vehicleName: 'Tempo Traveller', bookingTime: '04:00', driverName: 'Pending Assignment' },
];

export default function ChecklistPage() {
  const [selectedTab, setSelectedTab] = useState('today');
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<typeof completedChecklists[0] | null>(null);
  const [currentChecklist, setCurrentChecklist] = useState<Record<string, boolean>>({});

  const todayChecklists = completedChecklists.filter(c => c.date === '2024-01-18');
  const issuesCount = completedChecklists.filter(c => c.status === 'issues').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-700 border-green-200';
      case 'issues': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCheckItem = (itemId: string) => {
    setCurrentChecklist(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const totalRequired = checklistItems.reduce((sum, cat) => sum + cat.items.filter(i => i.required).length, 0);
  const checkedRequired = Object.entries(currentChecklist)
    .filter(([key, value]) => value && checklistItems.some(cat => cat.items.some(i => i.id === key && i.required)))
    .length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Checklist</h1>
          <p className="text-gray-600">Pre-trip and post-trip vehicle inspections</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Edit Checklist
          </button>
          <button
            onClick={() => setShowChecklistModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Inspection
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-sm">Today&apos;s Inspections</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayChecklists.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Passed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{todayChecklists.filter(c => c.status === 'passed').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">With Issues</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{issuesCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending Today</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{pendingToday.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Checklist Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{checklistItems.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingToday.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Pending Inspections</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingToday.map(item => (
              <button
                key={item.id}
                onClick={() => setShowChecklistModal(true)}
                className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition flex items-center gap-2"
              >
                <Car className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{item.vehicleName}</span>
                <span className="text-blue-600">•</span>
                <span className="text-gray-600">Booking at {item.bookingTime}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'today', label: 'Today', icon: Calendar },
          { id: 'history', label: 'History', icon: FileText },
          { id: 'issues', label: 'Open Issues', icon: AlertTriangle, count: issuesCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count && tab.count > 0 && (
              <span className={`text-xs px-1.5 rounded-full ${
                selectedTab === tab.id ? 'bg-white/20' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {selectedTab === 'today' && (
        <div className="space-y-4">
          {todayChecklists.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No inspections completed today</p>
            </div>
          ) : (
            todayChecklists.map(checklist => (
              <div
                key={checklist.id}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedChecklist(checklist)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${checklist.status === 'passed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {checklist.status === 'passed' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{checklist.vehicleName}</h3>
                      <p className="text-sm text-gray-500">{checklist.vehicleId} • {checklist.tripType}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {checklist.driverName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {checklist.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Fuel className="w-4 h-4" />
                          {checklist.fuelLevel}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checklist.status)}`}>
                      {checklist.passedItems}/{checklist.totalItems} items
                    </span>
                    {checklist.photos > 0 && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-1">
                        <Camera className="w-3 h-3" />
                        {checklist.photos} photos
                      </p>
                    )}
                  </div>
                </div>
                {checklist.issues && checklist.issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                    {checklist.issues.map((issue, idx) => (
                      <span key={idx} className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {selectedTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date/Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Driver</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completedChecklists.map(checklist => (
                  <tr key={checklist.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{checklist.date}</p>
                      <p className="text-sm text-gray-500">{checklist.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{checklist.vehicleName}</p>
                      <p className="text-sm text-gray-500">{checklist.vehicleId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{checklist.driverName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        checklist.tripType === 'Pre-Trip' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {checklist.tripType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{checklist.passedItems}/{checklist.totalItems}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checklist.status)}`}>
                        {checklist.status === 'passed' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {checklist.status.charAt(0).toUpperCase() + checklist.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedChecklist(checklist)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {selectedTab === 'issues' && (
        <div className="space-y-4">
          {completedChecklists.filter(c => c.status === 'issues').map(checklist => (
            <div key={checklist.id} className="bg-white rounded-xl border border-yellow-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{checklist.vehicleName}</h3>
                  <p className="text-sm text-gray-500">{checklist.vehicleId} • {checklist.date}</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {checklist.issues?.length} issue(s)
                </span>
              </div>
              <div className="space-y-2">
                {checklist.issues?.map((issue, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-900">{issue}</span>
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                      Mark Resolved
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Inspection</h2>
                  <p className="text-gray-600">Pre-trip checklist</p>
                </div>
                <button onClick={() => setShowChecklistModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Required items completed</span>
                  <span className="font-medium">{checkedRequired}/{totalRequired}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${checkedRequired === totalRequired ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${(checkedRequired / totalRequired) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Vehicle Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Select vehicle</option>
                    <option>Innova Crysta - MH04AB1234</option>
                    <option>Swift Dzire - MH04CD5678</option>
                    <option>Mercedes E-Class - MH04IJ7890</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading</label>
                  <input
                    type="number"
                    placeholder="Current KM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Checklist Categories */}
              {checklistItems.map(category => (
                <div key={category.id}>
                  <h3 className="font-semibold text-gray-900 mb-3">{category.category}</h3>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                          currentChecklist[item.id] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={currentChecklist[item.id] || false}
                            onChange={() => handleCheckItem(item.id)}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className={currentChecklist[item.id] ? 'text-green-700' : 'text-gray-700'}>
                            {item.name}
                          </span>
                        </div>
                        {item.required && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Fuel Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Level</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Empty</span>
                  <span>Full</span>
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to take photos</p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any observations or issues..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={checkedRequired < totalRequired}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
