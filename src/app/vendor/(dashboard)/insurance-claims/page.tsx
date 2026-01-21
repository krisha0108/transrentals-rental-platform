'use client';

import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Car,
  Calendar,
  IndianRupee,
  Upload,
  Download,
  Eye,
  Edit,
  Phone,
  Mail,
  User,
  MapPin,
  Camera,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  RefreshCcw,
  Paperclip
} from 'lucide-react';

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  vehicle: {
    name: string;
    number: string;
    insuranceProvider: string;
    policyNumber: string;
  };
  incidentDate: string;
  incidentLocation: string;
  incidentType: 'accident' | 'theft' | 'fire' | 'natural_disaster' | 'vandalism' | 'third_party';
  description: string;
  claimAmount: number;
  approvedAmount: number | null;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'settled';
  driver?: string;
  thirdParty?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  documents: {
    name: string;
    type: string;
    uploaded: boolean;
  }[];
  timeline: {
    date: string;
    action: string;
    by: string;
  }[];
  surveyorDetails?: {
    name: string;
    phone: string;
    visitDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock claims data
const mockClaims: InsuranceClaim[] = [
  {
    id: 'IC001',
    claimNumber: 'CLM-2024-001',
    vehicle: {
      name: 'Toyota Innova',
      number: 'KA-01-AB-1234',
      insuranceProvider: 'ICICI Lombard',
      policyNumber: 'POL-98765432'
    },
    incidentDate: '2024-01-15',
    incidentLocation: 'Outer Ring Road, near Marathahalli',
    incidentType: 'accident',
    description: 'Rear-end collision at signal. Other vehicle hit from behind while waiting at red light. Bumper and taillight damaged.',
    claimAmount: 45000,
    approvedAmount: 42000,
    status: 'approved',
    driver: 'Ramesh Kumar',
    thirdParty: {
      name: 'Suresh Reddy',
      phone: '+91 98765 43210',
      vehicleNumber: 'KA-03-CD-5678'
    },
    documents: [
      { name: 'FIR Copy', type: 'pdf', uploaded: true },
      { name: 'Claim Form', type: 'pdf', uploaded: true },
      { name: 'Damage Photos', type: 'image', uploaded: true },
      { name: 'Repair Estimate', type: 'pdf', uploaded: true },
      { name: 'Driver License', type: 'pdf', uploaded: true }
    ],
    timeline: [
      { date: '2024-01-15', action: 'Incident reported', by: 'Ramesh Kumar' },
      { date: '2024-01-16', action: 'Claim submitted', by: 'Admin' },
      { date: '2024-01-18', action: 'Surveyor assigned', by: 'ICICI Lombard' },
      { date: '2024-01-20', action: 'Survey completed', by: 'Mr. Sharma' },
      { date: '2024-01-25', action: 'Claim approved for ₹42,000', by: 'ICICI Lombard' }
    ],
    surveyorDetails: {
      name: 'Mr. Sharma',
      phone: '+91 99887 76655',
      visitDate: '2024-01-20'
    },
    createdAt: '2024-01-16',
    updatedAt: '2024-01-25'
  },
  {
    id: 'IC002',
    claimNumber: 'CLM-2024-002',
    vehicle: {
      name: 'Maruti Swift',
      number: 'KA-01-EF-5678',
      insuranceProvider: 'HDFC Ergo',
      policyNumber: 'POL-12345678'
    },
    incidentDate: '2024-01-18',
    incidentLocation: 'HSR Layout, Sector 2',
    incidentType: 'theft',
    description: 'Vehicle stolen from customer parking area overnight. Customer reported missing in the morning.',
    claimAmount: 650000,
    approvedAmount: null,
    status: 'under_review',
    documents: [
      { name: 'FIR Copy', type: 'pdf', uploaded: true },
      { name: 'Claim Form', type: 'pdf', uploaded: true },
      { name: 'RC Copy', type: 'pdf', uploaded: true },
      { name: 'Key Set Photo', type: 'image', uploaded: true },
      { name: 'CCTV Footage', type: 'video', uploaded: false }
    ],
    timeline: [
      { date: '2024-01-18', action: 'Theft reported to police', by: 'Admin' },
      { date: '2024-01-18', action: 'FIR filed', by: 'Admin' },
      { date: '2024-01-19', action: 'Claim submitted', by: 'Admin' },
      { date: '2024-01-20', action: 'Investigation started', by: 'HDFC Ergo' }
    ],
    createdAt: '2024-01-19',
    updatedAt: '2024-01-20'
  },
  {
    id: 'IC003',
    claimNumber: 'CLM-2024-003',
    vehicle: {
      name: 'Honda City',
      number: 'KA-01-GH-9012',
      insuranceProvider: 'Bajaj Allianz',
      policyNumber: 'POL-55667788'
    },
    incidentDate: '2024-01-10',
    incidentLocation: 'Whitefield, ITPL Main Road',
    incidentType: 'accident',
    description: 'Side collision with auto-rickshaw. Minor dents on left side doors.',
    claimAmount: 28000,
    approvedAmount: 28000,
    status: 'settled',
    driver: 'Prakash Nair',
    documents: [
      { name: 'FIR Copy', type: 'pdf', uploaded: true },
      { name: 'Claim Form', type: 'pdf', uploaded: true },
      { name: 'Damage Photos', type: 'image', uploaded: true },
      { name: 'Repair Invoice', type: 'pdf', uploaded: true }
    ],
    timeline: [
      { date: '2024-01-10', action: 'Incident reported', by: 'Prakash Nair' },
      { date: '2024-01-11', action: 'Claim submitted', by: 'Admin' },
      { date: '2024-01-13', action: 'Survey completed', by: 'Mr. Verma' },
      { date: '2024-01-15', action: 'Claim approved', by: 'Bajaj Allianz' },
      { date: '2024-01-18', action: 'Amount settled - ₹28,000', by: 'Bajaj Allianz' }
    ],
    surveyorDetails: {
      name: 'Mr. Verma',
      phone: '+91 98765 11223',
      visitDate: '2024-01-13'
    },
    createdAt: '2024-01-11',
    updatedAt: '2024-01-18'
  },
  {
    id: 'IC004',
    claimNumber: 'CLM-2024-004',
    vehicle: {
      name: 'Mahindra XUV500',
      number: 'KA-01-IJ-3456',
      insuranceProvider: 'ICICI Lombard',
      policyNumber: 'POL-99887766'
    },
    incidentDate: '2024-01-20',
    incidentLocation: 'Electronic City Phase 1',
    incidentType: 'vandalism',
    description: 'Windshield broken and scratches on bonnet. Vehicle parked at customer site.',
    claimAmount: 35000,
    approvedAmount: null,
    status: 'submitted',
    documents: [
      { name: 'Claim Form', type: 'pdf', uploaded: true },
      { name: 'Damage Photos', type: 'image', uploaded: true },
      { name: 'Police Complaint', type: 'pdf', uploaded: false }
    ],
    timeline: [
      { date: '2024-01-20', action: 'Incident discovered', by: 'Driver' },
      { date: '2024-01-20', action: 'Claim initiated', by: 'Admin' }
    ],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20'
  }
];

const incidentTypes = {
  accident: { label: 'Accident', color: 'bg-red-100 text-red-700' },
  theft: { label: 'Theft', color: 'bg-purple-100 text-purple-700' },
  fire: { label: 'Fire', color: 'bg-orange-100 text-orange-700' },
  natural_disaster: { label: 'Natural Disaster', color: 'bg-blue-100 text-blue-700' },
  vandalism: { label: 'Vandalism', color: 'bg-yellow-100 text-yellow-700' },
  third_party: { label: 'Third Party', color: 'bg-gray-100 text-gray-700' }
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  settled: { label: 'Settled', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
};

export default function InsuranceClaimsPage() {
  const [claims] = useState<InsuranceClaim[]>(mockClaims);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.vehicle.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: claims.length,
    pending: claims.filter(c => ['submitted', 'under_review'].includes(c.status)).length,
    approved: claims.filter(c => c.status === 'approved' || c.status === 'settled').length,
    totalClaimAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0),
    totalApproved: claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0)
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance Claims</h1>
          <p className="text-gray-600 mt-1">Manage vehicle insurance claims and settlements</p>
        </div>

        <button
          onClick={() => setShowNewClaimModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          File New Claim
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Claims</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approved/Settled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalClaimAmount)}</p>
              <p className="text-sm text-gray-500">Total Claimed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalApproved)}</p>
              <p className="text-sm text-gray-500">Total Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by claim number or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredClaims.map(claim => {
            const StatusIcon = statusConfig[claim.status].icon;
            return (
              <div
                key={claim.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedClaim(claim)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Shield className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{claim.claimNumber}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${incidentTypes[claim.incidentType].color}`}>
                          {incidentTypes[claim.incidentType].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {claim.vehicle.name} ({claim.vehicle.number})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(claim.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{claim.incidentLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Claim Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(claim.claimAmount)}</p>
                    </div>

                    {claim.approvedAmount !== null && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Approved</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(claim.approvedAmount)}</p>
                      </div>
                    )}

                    <span className={`flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusConfig[claim.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig[claim.status].label}
                    </span>

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Document Status */}
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs text-gray-500">Documents:</span>
                  <div className="flex items-center gap-2">
                    {claim.documents.slice(0, 4).map((doc, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 text-xs rounded ${
                          doc.uploaded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {doc.name}
                      </span>
                    ))}
                    {claim.documents.length > 4 && (
                      <span className="text-xs text-gray-500">+{claim.documents.length - 4} more</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">{selectedClaim.claimNumber}</h2>
                    <span className={`px-2 py-0.5 text-sm font-medium rounded-full ${statusConfig[selectedClaim.status].color}`}>
                      {statusConfig[selectedClaim.status].label}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">{selectedClaim.vehicle.insuranceProvider} - {selectedClaim.vehicle.policyNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Vehicle & Incident Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-600" />
                    Vehicle Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="font-medium text-gray-900">{selectedClaim.vehicle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registration</span>
                      <span className="font-medium text-gray-900">{selectedClaim.vehicle.number}</span>
                    </div>
                    {selectedClaim.driver && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Driver</span>
                        <span className="font-medium text-gray-900">{selectedClaim.driver}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    Incident Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className={`px-2 py-0.5 rounded ${incidentTypes[selectedClaim.incidentType].color}`}>
                        {incidentTypes[selectedClaim.incidentType].label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedClaim.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium text-gray-900 text-right max-w-[200px]">{selectedClaim.incidentLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Incident Description</h3>
                <p className="text-gray-600">{selectedClaim.description}</p>
              </div>

              {/* Claim Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-blue-600 mb-1">Claim Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedClaim.claimAmount)}</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${selectedClaim.approvedAmount ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <p className={`text-sm mb-1 ${selectedClaim.approvedAmount ? 'text-green-600' : 'text-gray-500'}`}>
                    Approved Amount
                  </p>
                  <p className={`text-2xl font-bold ${selectedClaim.approvedAmount ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedClaim.approvedAmount ? formatCurrency(selectedClaim.approvedAmount) : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Third Party Details */}
              {selectedClaim.thirdParty && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-600" />
                    Third Party Details
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedClaim.thirdParty.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedClaim.thirdParty.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vehicle Number</p>
                      <p className="font-medium text-gray-900">{selectedClaim.thirdParty.vehicleNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Surveyor Details */}
              {selectedClaim.surveyorDetails && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-purple-600" />
                    Surveyor Details
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-purple-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedClaim.surveyorDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-purple-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedClaim.surveyorDetails.phone}</p>
                    </div>
                    <div>
                      <p className="text-purple-600">Visit Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedClaim.surveyorDetails.visitDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                  Documents
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedClaim.documents.map((doc, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        doc.uploaded ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className={`w-4 h-4 ${doc.uploaded ? 'text-green-600' : 'text-red-600'}`} />
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                        {doc.uploaded ? (
                          <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                        ) : (
                          <Upload className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-600" />
                        )}
                      </div>
                      <span className={`text-xs ${doc.uploaded ? 'text-green-600' : 'text-red-600'}`}>
                        {doc.uploaded ? 'Uploaded' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Claim Timeline</h3>
                <div className="space-y-3">
                  {selectedClaim.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        {index < selectedClaim.timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-gray-900">{event.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {event.by}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <MessageSquare className="w-4 h-4" />
                  Contact Insurer
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RefreshCcw className="w-4 h-4" />
                  Check Status
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">File New Insurance Claim</h2>
                <button
                  onClick={() => setShowNewClaimModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Select Vehicle</option>
                  <option>Toyota Innova - KA-01-AB-1234</option>
                  <option>Maruti Swift - KA-01-EF-5678</option>
                  <option>Honda City - KA-01-GH-9012</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="accident">Accident</option>
                    <option value="theft">Theft</option>
                    <option value="fire">Fire</option>
                    <option value="natural_disaster">Natural Disaster</option>
                    <option value="vandalism">Vandalism</option>
                    <option value="third_party">Third Party</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Location</label>
                <input
                  type="text"
                  placeholder="Enter location where incident occurred"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened in detail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Claim Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    placeholder="Enter estimated damage cost"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Drag and drop photos/documents here, or{' '}
                    <span className="text-blue-600 cursor-pointer">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    FIR Copy, Damage Photos, Claim Form, Driver License
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewClaimModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                  Save as Draft
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Submit Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
