'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  FileText,
  Play,
  BookOpen,
  Target,
  TrendingUp,
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronRight,
  Star,
  RefreshCcw,
  Download,
  Eye
} from 'lucide-react';

interface Training {
  id: string;
  title: string;
  category: 'safety' | 'customer_service' | 'vehicle_operation' | 'compliance' | 'first_aid' | 'defensive_driving';
  type: 'online' | 'classroom' | 'practical';
  duration: string;
  mandatory: boolean;
  description: string;
}

interface DriverTraining {
  id: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    joinDate: string;
  };
  trainings: {
    trainingId: string;
    title: string;
    category: string;
    status: 'completed' | 'in_progress' | 'pending' | 'expired';
    completedDate?: string;
    expiryDate?: string;
    score?: number;
    certificate?: string;
  }[];
  overallProgress: number;
  certifications: {
    name: string;
    issueDate: string;
    expiryDate: string;
    status: 'valid' | 'expiring_soon' | 'expired';
  }[];
}

// Mock training programs
const trainingPrograms: Training[] = [
  { id: 'T001', title: 'Defensive Driving Course', category: 'defensive_driving', type: 'practical', duration: '4 hours', mandatory: true, description: 'Learn advanced driving techniques to prevent accidents' },
  { id: 'T002', title: 'Customer Service Excellence', category: 'customer_service', type: 'online', duration: '2 hours', mandatory: true, description: 'How to provide excellent service to customers' },
  { id: 'T003', title: 'Vehicle Safety Inspection', category: 'safety', type: 'classroom', duration: '3 hours', mandatory: true, description: 'Pre-trip and post-trip inspection procedures' },
  { id: 'T004', title: 'First Aid & Emergency Response', category: 'first_aid', type: 'practical', duration: '6 hours', mandatory: true, description: 'Basic first aid and handling emergencies' },
  { id: 'T005', title: 'Traffic Rules & Regulations', category: 'compliance', type: 'online', duration: '1.5 hours', mandatory: true, description: 'Updated traffic laws and compliance requirements' },
  { id: 'T006', title: 'Luxury Vehicle Handling', category: 'vehicle_operation', type: 'practical', duration: '3 hours', mandatory: false, description: 'Special handling for premium vehicles' },
];

// Mock driver training data
const mockDriverTrainings: DriverTraining[] = [
  {
    id: 'DT001',
    driver: { id: 'D001', name: 'Ramesh Kumar', phone: '+91 9737965551', joinDate: '2022-03-15' },
    trainings: [
      { trainingId: 'T001', title: 'Defensive Driving Course', category: 'defensive_driving', status: 'completed', completedDate: '2024-01-10', expiryDate: '2025-01-10', score: 92 },
      { trainingId: 'T002', title: 'Customer Service Excellence', category: 'customer_service', status: 'completed', completedDate: '2024-01-05', score: 88 },
      { trainingId: 'T003', title: 'Vehicle Safety Inspection', category: 'safety', status: 'completed', completedDate: '2023-12-20', score: 95 },
      { trainingId: 'T004', title: 'First Aid & Emergency Response', category: 'first_aid', status: 'in_progress' },
      { trainingId: 'T005', title: 'Traffic Rules & Regulations', category: 'compliance', status: 'completed', completedDate: '2024-01-08', score: 85 }
    ],
    overallProgress: 80,
    certifications: [
      { name: 'Commercial Driving License', issueDate: '2020-05-12', expiryDate: '2025-05-12', status: 'valid' },
      { name: 'Defensive Driving Certificate', issueDate: '2024-01-10', expiryDate: '2025-01-10', status: 'valid' }
    ]
  },
  {
    id: 'DT002',
    driver: { id: 'D002', name: 'Suresh Babu', phone: '+91 9737965551', joinDate: '2023-06-20' },
    trainings: [
      { trainingId: 'T001', title: 'Defensive Driving Course', category: 'defensive_driving', status: 'pending' },
      { trainingId: 'T002', title: 'Customer Service Excellence', category: 'customer_service', status: 'completed', completedDate: '2024-01-12', score: 75 },
      { trainingId: 'T003', title: 'Vehicle Safety Inspection', category: 'safety', status: 'in_progress' },
      { trainingId: 'T004', title: 'First Aid & Emergency Response', category: 'first_aid', status: 'pending' },
      { trainingId: 'T005', title: 'Traffic Rules & Regulations', category: 'compliance', status: 'completed', completedDate: '2024-01-15', score: 80 }
    ],
    overallProgress: 40,
    certifications: [
      { name: 'Commercial Driving License', issueDate: '2021-08-22', expiryDate: '2024-02-22', status: 'expiring_soon' }
    ]
  },
  {
    id: 'DT003',
    driver: { id: 'D003', name: 'Prakash Raj', phone: '+91 97379 65551', joinDate: '2021-11-10' },
    trainings: [
      { trainingId: 'T001', title: 'Defensive Driving Course', category: 'defensive_driving', status: 'expired', completedDate: '2023-01-15', expiryDate: '2024-01-15', score: 88 },
      { trainingId: 'T002', title: 'Customer Service Excellence', category: 'customer_service', status: 'completed', completedDate: '2023-11-20', score: 92 },
      { trainingId: 'T003', title: 'Vehicle Safety Inspection', category: 'safety', status: 'completed', completedDate: '2023-10-05', score: 90 },
      { trainingId: 'T004', title: 'First Aid & Emergency Response', category: 'first_aid', status: 'completed', completedDate: '2023-09-18', expiryDate: '2025-09-18', score: 85 },
      { trainingId: 'T005', title: 'Traffic Rules & Regulations', category: 'compliance', status: 'completed', completedDate: '2023-12-01', score: 78 }
    ],
    overallProgress: 95,
    certifications: [
      { name: 'Commercial Driving License', issueDate: '2019-11-10', expiryDate: '2024-11-10', status: 'valid' },
      { name: 'First Aid Certificate', issueDate: '2023-09-18', expiryDate: '2025-09-18', status: 'valid' },
      { name: 'Defensive Driving Certificate', issueDate: '2023-01-15', expiryDate: '2024-01-15', status: 'expired' }
    ]
  }
];

const categoryConfig = {
  safety: { label: 'Safety', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  customer_service: { label: 'Customer Service', color: 'bg-blue-100 text-blue-700', icon: Star },
  vehicle_operation: { label: 'Vehicle Operation', color: 'bg-purple-100 text-purple-700', icon: Target },
  compliance: { label: 'Compliance', color: 'bg-green-100 text-green-700', icon: FileText },
  first_aid: { label: 'First Aid', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  defensive_driving: { label: 'Defensive Driving', color: 'bg-cyan-100 text-cyan-700', icon: TrendingUp }
};

const statusConfig = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' }
};

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'programs' | 'certifications'>('drivers');
  const [driverTrainings] = useState<DriverTraining[]>(mockDriverTrainings);
  const [selectedDriver, setSelectedDriver] = useState<DriverTraining | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const stats = {
    totalDrivers: driverTrainings.length,
    fullyTrained: driverTrainings.filter(d => d.overallProgress === 100).length,
    inProgress: driverTrainings.filter(d => d.overallProgress > 0 && d.overallProgress < 100).length,
    expiredCerts: driverTrainings.reduce((count, d) => count + d.certifications.filter(c => c.status === 'expired').length, 0),
    expiringCerts: driverTrainings.reduce((count, d) => count + d.certifications.filter(c => c.status === 'expiring_soon').length, 0)
  };

  const filteredDrivers = driverTrainings.filter(d =>
    d.driver.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Training</h1>
          <p className="text-gray-600 mt-1">Manage training programs and certifications</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Training
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
              <p className="text-sm text-gray-500">Total Drivers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.fullyTrained}</p>
              <p className="text-sm text-gray-500">Fully Trained</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringCerts}</p>
              <p className="text-sm text-gray-500">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiredCerts}</p>
              <p className="text-sm text-gray-500">Expired Certs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {[
              { id: 'drivers', label: 'Driver Progress', icon: User },
              { id: 'programs', label: 'Training Programs', icon: BookOpen },
              { id: 'certifications', label: 'Certifications', icon: Award }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Driver Progress Tab */}
        {activeTab === 'drivers' && (
          <div className="divide-y divide-gray-100">
            {filteredDrivers.map(driver => (
              <div
                key={driver.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedDriver(driver)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{driver.driver.name}</h3>
                      <p className="text-sm text-gray-500">{driver.driver.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Progress */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Training Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${driver.overallProgress === 100 ? 'bg-green-500' :
                                driver.overallProgress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}
                            style={{ width: `${driver.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{driver.overallProgress}%</span>
                      </div>
                    </div>

                    {/* Training Status Summary */}
                    <div className="flex gap-1">
                      {driver.trainings.slice(0, 5).map((t, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-green-500' :
                              t.status === 'in_progress' ? 'bg-blue-500' :
                                t.status === 'expired' ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          title={`${t.title}: ${t.status}`}
                        />
                      ))}
                    </div>

                    {/* Cert Alerts */}
                    {driver.certifications.some(c => c.status === 'expired' || c.status === 'expiring_soon') && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        Cert Alert
                      </span>
                    )}

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Trainings List */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {driver.trainings.map((training, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs font-medium rounded ${statusConfig[training.status].color}`}
                    >
                      {training.title.split(' ').slice(0, 2).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Training Programs Tab */}
        {activeTab === 'programs' && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingPrograms.map(program => {
                const CategoryIcon = categoryConfig[program.category].icon;
                return (
                  <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${categoryConfig[program.category].color.split(' ')[0]}`}>
                          <CategoryIcon className={`w-5 h-5 ${categoryConfig[program.category].color.split(' ')[1]}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{program.title}</h3>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mt-1 ${categoryConfig[program.category].color}`}>
                            {categoryConfig[program.category].label}
                          </span>
                        </div>
                      </div>
                      {program.mandatory && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{program.description}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {program.duration}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          {program.type === 'online' ? <Play className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                          {program.type}
                        </span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="p-4">
            <div className="space-y-4">
              {driverTrainings.map(driver => (
                <div key={driver.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{driver.driver.name}</h3>
                        <p className="text-sm text-gray-500">{driver.certifications.length} certifications</p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {driver.certifications.map((cert, index) => (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Award className={`w-5 h-5 ${cert.status === 'valid' ? 'text-green-600' :
                              cert.status === 'expiring_soon' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          <div>
                            <p className="font-medium text-gray-900">{cert.name}</p>
                            <p className="text-sm text-gray-500">
                              Issued: {new Date(cert.issueDate).toLocaleDateString('en-IN')} •
                              Expires: {new Date(cert.expiryDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                              cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {cert.status === 'valid' ? 'Valid' : cert.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                          </span>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDriver.driver.name}</h2>
                    <p className="text-gray-500">{selectedDriver.driver.phone}</p>
                    <p className="text-sm text-gray-400">Joined: {new Date(selectedDriver.driver.joinDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Training Progress</span>
                  <span className="text-sm font-bold text-gray-900">{selectedDriver.overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${selectedDriver.overallProgress === 100 ? 'bg-green-500' :
                        selectedDriver.overallProgress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                    style={{ width: `${selectedDriver.overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Trainings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Training Modules</h3>
                <div className="space-y-2">
                  {selectedDriver.trainings.map((training, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${training.status === 'completed' ? 'bg-green-100' :
                            training.status === 'in_progress' ? 'bg-blue-100' :
                              training.status === 'expired' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                          {training.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : training.status === 'expired' ? (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{training.title}</p>
                          {training.completedDate && (
                            <p className="text-xs text-gray-500">
                              Completed: {new Date(training.completedDate).toLocaleDateString('en-IN')}
                              {training.score && ` • Score: ${training.score}%`}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusConfig[training.status].color}`}>
                        {statusConfig[training.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Certifications</h3>
                <div className="space-y-2">
                  {selectedDriver.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className={`w-5 h-5 ${cert.status === 'valid' ? 'text-green-600' :
                            cert.status === 'expiring_soon' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        <div>
                          <p className="font-medium text-gray-900">{cert.name}</p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(cert.expiryDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                          cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {cert.status === 'valid' ? 'Valid' : cert.status === 'expiring_soon' ? 'Expiring Soon' : 'Expired'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Assign Training
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
