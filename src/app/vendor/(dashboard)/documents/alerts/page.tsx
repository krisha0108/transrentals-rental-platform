'use client';

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Car,
  Bell,
  Settings,
  Upload,
  Download,
  Eye,
  XCircle,
  ChevronRight,
  Shield,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

// Document types
const documentTypes = [
  { id: 'rc', name: 'Registration Certificate (RC)', icon: '📄', color: 'blue' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'green' },
  { id: 'puc', name: 'PUC Certificate', icon: '🌿', color: 'emerald' },
  { id: 'permit', name: 'Permit', icon: '📋', color: 'purple' },
  { id: 'fitness', name: 'Fitness Certificate', icon: '✅', color: 'cyan' },
  { id: 'tax', name: 'Road Tax', icon: '💰', color: 'yellow' },
];

// Mock vehicles with documents
const vehicleDocuments = [
  {
    id: 'MH04AB1234',
    name: 'Innova Crysta',
    type: 'SUV',
    documents: [
      { type: 'rc', number: 'MH04AB1234', validFrom: '2020-03-15', validUntil: '2035-03-14', status: 'valid' },
      { type: 'insurance', number: 'INS-2024-78945', validFrom: '2024-01-01', validUntil: '2024-04-30', status: 'expiring' },
      { type: 'puc', number: 'PUC-MH-456789', validFrom: '2023-12-01', validUntil: '2024-06-01', status: 'valid' },
      { type: 'permit', number: 'PER-MH-12345', validFrom: '2023-06-01', validUntil: '2024-05-31', status: 'valid' },
      { type: 'fitness', number: 'FIT-MH-98765', validFrom: '2023-04-01', validUntil: '2024-03-31', status: 'expiring' },
    ],
  },
  {
    id: 'MH04CD5678',
    name: 'Swift Dzire',
    type: 'Sedan',
    documents: [
      { type: 'rc', number: 'MH04CD5678', validFrom: '2021-06-20', validUntil: '2036-06-19', status: 'valid' },
      { type: 'insurance', number: 'INS-2023-45678', validFrom: '2023-07-01', validUntil: '2024-01-15', status: 'expired' },
      { type: 'puc', number: 'PUC-MH-123456', validFrom: '2023-08-15', validUntil: '2024-02-15', status: 'expiring' },
      { type: 'permit', number: 'PER-MH-67890', validFrom: '2023-01-01', validUntil: '2024-12-31', status: 'valid' },
    ],
  },
  {
    id: 'MH04EF9012',
    name: '45 Seater Bus',
    type: 'Bus',
    documents: [
      { type: 'rc', number: 'MH04EF9012', validFrom: '2019-02-10', validUntil: '2034-02-09', status: 'valid' },
      { type: 'insurance', number: 'INS-2024-11111', validFrom: '2024-01-10', validUntil: '2025-01-09', status: 'valid' },
      { type: 'puc', number: 'PUC-MH-999888', validFrom: '2023-11-20', validUntil: '2024-05-20', status: 'valid' },
      { type: 'permit', number: 'PER-MH-55555', validFrom: '2023-08-01', validUntil: '2024-07-31', status: 'valid' },
      { type: 'fitness', number: 'FIT-MH-77777', validFrom: '2023-09-01', validUntil: '2024-08-31', status: 'valid' },
      { type: 'tax', number: 'TAX-MH-33333', validFrom: '2023-04-01', validUntil: '2024-03-31', status: 'expiring' },
    ],
  },
  {
    id: 'MH04GH3456',
    name: 'Ertiga',
    type: 'MUV',
    documents: [
      { type: 'rc', number: 'MH04GH3456', validFrom: '2022-09-05', validUntil: '2037-09-04', status: 'valid' },
      { type: 'insurance', number: 'INS-2024-22222', validFrom: '2024-01-05', validUntil: '2025-01-04', status: 'valid' },
      { type: 'puc', number: 'PUC-MH-444555', validFrom: '2024-01-10', validUntil: '2024-07-10', status: 'valid' },
    ],
  },
  {
    id: 'MH04IJ7890',
    name: 'Mercedes E-Class',
    type: 'Luxury',
    documents: [
      { type: 'rc', number: 'MH04IJ7890', validFrom: '2023-01-15', validUntil: '2038-01-14', status: 'valid' },
      { type: 'insurance', number: 'INS-2024-99999', validFrom: '2024-01-15', validUntil: '2025-01-14', status: 'valid' },
      { type: 'puc', number: 'PUC-MH-888777', validFrom: '2023-12-20', validUntil: '2024-06-20', status: 'valid' },
    ],
  },
];

// Calculate document alerts
const getDocumentAlerts = () => {
  const alerts: Array<{
    vehicleId: string;
    vehicleName: string;
    docType: string;
    docTypeName: string;
    docNumber: string;
    validUntil: string;
    daysRemaining: number;
    status: 'expired' | 'critical' | 'warning' | 'valid';
  }> = [];

  const today = new Date('2024-01-18');

  vehicleDocuments.forEach(vehicle => {
    vehicle.documents.forEach(doc => {
      const expiry = new Date(doc.validUntil);
      const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const docType = documentTypes.find(d => d.id === doc.type);

      let status: 'expired' | 'critical' | 'warning' | 'valid' = 'valid';
      if (daysRemaining < 0) status = 'expired';
      else if (daysRemaining <= 7) status = 'critical';
      else if (daysRemaining <= 30) status = 'warning';

      if (status !== 'valid') {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          docType: doc.type,
          docTypeName: docType?.name || doc.type,
          docNumber: doc.number,
          validUntil: doc.validUntil,
          daysRemaining,
          status,
        });
      }
    });
  });

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
};

export default function DocumentAlertsPage() {
  const [selectedTab, setSelectedTab] = useState('alerts');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehicleDocuments[0] | null>(null);

  const alerts = getDocumentAlerts();
  const expiredCount = alerts.filter(a => a.status === 'expired').length;
  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const warningCount = alerts.filter(a => a.status === 'warning').length;

  const filteredAlerts = filterType === 'all'
    ? alerts
    : alerts.filter(a => a.docType === filterType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'critical': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'valid': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string, days: number) => {
    switch (status) {
      case 'expired': return `Expired ${Math.abs(days)} days ago`;
      case 'critical': return `Expires in ${days} days!`;
      case 'warning': return `Expires in ${days} days`;
      default: return 'Valid';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Expiry Alerts</h1>
          <p className="text-gray-600">Track RC, Insurance, PUC, Permit, and Fitness expiry dates</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Alert Settings
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {expiredCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Expired Documents!</h3>
            <p className="text-red-600 text-sm">{expiredCount} document(s) have expired. Renew immediately to avoid penalties and legal issues.</p>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex-shrink-0">
            View Expired
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Car className="w-4 h-4" />
            <span className="text-sm">Total Vehicles</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vehicleDocuments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Expired</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Critical (&lt;7 days)</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Warning (&lt;30 days)</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">All Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {vehicleDocuments.length - new Set(alerts.map(a => a.vehicleId)).size}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'alerts', label: 'Alerts', icon: Bell, count: alerts.length },
          { id: 'vehicles', label: 'By Vehicle', icon: Car },
          { id: 'documents', label: 'By Document Type', icon: FileText },
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
                selectedTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <>
          {/* Document Type Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            {documentTypes.map(doc => (
              <button
                key={doc.id}
                onClick={() => setFilterType(doc.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                  filterType === doc.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{doc.icon}</span>
                {doc.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800">All Documents Valid!</h3>
              <p className="text-green-600 text-sm">No documents expiring in the next 30 days.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Document</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Valid Until</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAlerts.map((alert, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{alert.vehicleName}</p>
                            <p className="text-sm text-gray-500">{alert.vehicleId}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span>{documentTypes.find(d => d.id === alert.docType)?.icon}</span>
                            <span className="font-medium text-gray-900">{alert.docTypeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{alert.docNumber}</td>
                        <td className="px-4 py-3 text-gray-700">{alert.validUntil}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(alert.status)}`}>
                            {alert.status === 'expired' && <XCircle className="w-3 h-3" />}
                            {alert.status === 'critical' && <AlertTriangle className="w-3 h-3" />}
                            {alert.status === 'warning' && <Clock className="w-3 h-3" />}
                            {getStatusLabel(alert.status, alert.daysRemaining)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Renew
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="View">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicleDocuments.map(vehicle => {
            const vehicleAlerts = alerts.filter(a => a.vehicleId === vehicle.id);
            const hasExpired = vehicleAlerts.some(a => a.status === 'expired');
            const hasCritical = vehicleAlerts.some(a => a.status === 'critical');
            const hasWarning = vehicleAlerts.some(a => a.status === 'warning');

            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${
                  hasExpired ? 'border-red-300' : hasCritical ? 'border-orange-300' : hasWarning ? 'border-yellow-300' : 'border-gray-200'
                }`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500">{vehicle.id} • {vehicle.type}</p>
                  </div>
                  {hasExpired ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Expired
                    </span>
                  ) : hasCritical ? (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Critical
                    </span>
                  ) : hasWarning ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Warning
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> OK
                    </span>
                  )}
                </div>

                {/* Document Status Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {vehicle.documents.slice(0, 6).map((doc, idx) => {
                    const docType = documentTypes.find(d => d.id === doc.type);
                    const alert = vehicleAlerts.find(a => a.docType === doc.type);
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg text-center ${
                          alert?.status === 'expired' ? 'bg-red-100' :
                          alert?.status === 'critical' ? 'bg-orange-100' :
                          alert?.status === 'warning' ? 'bg-yellow-100' :
                          'bg-green-50'
                        }`}
                        title={`${docType?.name}: ${doc.validUntil}`}
                      >
                        <span className="text-lg">{docType?.icon}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{vehicle.documents.length} documents</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Documents Tab */}
      {selectedTab === 'documents' && (
        <div className="space-y-4">
          {documentTypes.map(docType => {
            const docAlerts = alerts.filter(a => a.docType === docType.id);
            const totalDocs = vehicleDocuments.reduce((count, v) =>
              count + v.documents.filter(d => d.type === docType.id).length, 0
            );

            return (
              <div key={docType.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{docType.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{docType.name}</h3>
                      <p className="text-sm text-gray-500">{totalDocs} documents across all vehicles</p>
                    </div>
                  </div>
                  {docAlerts.length > 0 ? (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      docAlerts.some(a => a.status === 'expired') ? 'bg-red-100 text-red-700' :
                      docAlerts.some(a => a.status === 'critical') ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {docAlerts.length} need attention
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      All valid
                    </span>
                  )}
                </div>

                {docAlerts.length > 0 && (
                  <div className="space-y-2">
                    {docAlerts.map((alert, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                        alert.status === 'expired' ? 'bg-red-50' :
                        alert.status === 'critical' ? 'bg-orange-50' :
                        'bg-yellow-50'
                      }`}>
                        <div>
                          <p className="font-medium text-gray-900">{alert.vehicleName}</p>
                          <p className="text-sm text-gray-500">{alert.docNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            alert.status === 'expired' ? 'text-red-600' :
                            alert.status === 'critical' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {getStatusLabel(alert.status, alert.daysRemaining)}
                          </p>
                          <p className="text-sm text-gray-500">{alert.validUntil}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedVehicle.name}</h2>
                  <p className="text-gray-600">{selectedVehicle.id} • {selectedVehicle.type}</p>
                </div>
                <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">All Documents</h3>
              <div className="space-y-3">
                {selectedVehicle.documents.map((doc, idx) => {
                  const docType = documentTypes.find(d => d.id === doc.type);
                  const alert = alerts.find(a => a.vehicleId === selectedVehicle.id && a.docType === doc.type);

                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      alert?.status === 'expired' ? 'bg-red-50 border-red-200' :
                      alert?.status === 'critical' ? 'bg-orange-50 border-orange-200' :
                      alert?.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{docType?.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">{docType?.name}</p>
                            <p className="text-sm text-gray-500">{doc.number}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {alert ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {getStatusLabel(alert.status, alert.daysRemaining)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3" /> Valid
                            </span>
                          )}
                          <p className="text-sm text-gray-500 mt-1">Expires: {doc.validUntil}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View
                        </button>
                        <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </button>
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Update
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
