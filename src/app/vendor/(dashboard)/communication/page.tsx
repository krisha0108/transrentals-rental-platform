'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Mail,
  Phone,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Check,
  Clock,
  Users,
  FileText,
  Star,
  Zap,
  Calendar,
  IndianRupee,
  Car,
  MapPin,
  Settings,
  ChevronRight,
  MessageCircle,
  Bell,
  XCircle,
} from 'lucide-react';

// Message templates
const messageTemplates = [
  {
    id: 1,
    name: 'Booking Confirmation',
    category: 'Booking',
    channel: 'whatsapp',
    message: `Hello {customer_name}! 🚗

Your booking has been confirmed!

📋 Booking ID: {booking_id}
🚘 Vehicle: {vehicle_type}
📍 Pickup: {pickup_location}
📅 Date: {date}
⏰ Time: {time}

Driver Details:
👤 {driver_name}
📞 {driver_phone}

Total: ₹{amount}

Thank you for choosing TransRentals!
For support: +91 9737965551`,
    variables: ['customer_name', 'booking_id', 'vehicle_type', 'pickup_location', 'date', 'time', 'driver_name', 'driver_phone', 'amount'],
    usageCount: 245,
  },
  {
    id: 2,
    name: 'Payment Reminder',
    category: 'Payment',
    channel: 'whatsapp',
    message: `Hello {customer_name},

This is a friendly reminder for your pending payment.

📋 Invoice: {invoice_id}
💰 Amount Due: ₹{amount}
📅 Due Date: {due_date}

Pay via UPI: transrentals@hdfc
Or Bank Transfer:
A/C: 50100123456789
IFSC: HDFC0001234

Please ignore if already paid.

Thank you!
TransRentals`,
    variables: ['customer_name', 'invoice_id', 'amount', 'due_date'],
    usageCount: 156,
  },
  {
    id: 3,
    name: 'Trip Started',
    category: 'Trip Update',
    channel: 'sms',
    message: `TransRentals: Your trip has started! Driver {driver_name} ({driver_phone}) is on the way. Vehicle: {vehicle_number}. Track: {tracking_link}`,
    variables: ['driver_name', 'driver_phone', 'vehicle_number', 'tracking_link'],
    usageCount: 189,
  },
  {
    id: 4,
    name: 'Trip Completed',
    category: 'Trip Update',
    channel: 'whatsapp',
    message: `Hello {customer_name}! 🎉

Your trip has been completed successfully!

📋 Trip ID: {booking_id}
📍 Route: {route}
🕐 Duration: {duration}
💰 Total: ₹{amount}

We hope you had a pleasant journey!

⭐ Please rate your experience:
{rating_link}

Thank you for traveling with us!
TransRentals`,
    variables: ['customer_name', 'booking_id', 'route', 'duration', 'amount', 'rating_link'],
    usageCount: 178,
  },
  {
    id: 5,
    name: 'Quotation Sent',
    category: 'Sales',
    channel: 'whatsapp',
    message: `Hello {customer_name}! 👋

Thank you for your inquiry!

Here's your quotation:
📋 Quote ID: {quote_id}
🚗 Service: {service}
📍 Route: {route}
📅 Date: {date}
💰 Price: ₹{amount}

Valid until: {valid_until}

To confirm, reply YES or call us.

TransRentals
📞 +91 9737965551`,
    variables: ['customer_name', 'quote_id', 'service', 'route', 'date', 'amount', 'valid_until'],
    usageCount: 134,
  },
  {
    id: 6,
    name: 'Driver Assigned',
    category: 'Booking',
    channel: 'sms',
    message: `TransRentals: Driver assigned for your booking {booking_id}. {driver_name} will call you 30 mins before pickup. Contact: {driver_phone}`,
    variables: ['booking_id', 'driver_name', 'driver_phone'],
    usageCount: 210,
  },
  {
    id: 7,
    name: 'Birthday Wish',
    category: 'Marketing',
    channel: 'whatsapp',
    message: `Happy Birthday {customer_name}! 🎂🎉

Wishing you a wonderful year ahead!

As a birthday treat, enjoy 10% OFF on your next booking with code: BDAY10

Valid for 30 days.
Book now: transrentals.in

Warm wishes,
TransRentals Team`,
    variables: ['customer_name'],
    usageCount: 45,
  },
  {
    id: 8,
    name: 'Feedback Request',
    category: 'Feedback',
    channel: 'whatsapp',
    message: `Hello {customer_name}!

We hope you enjoyed your recent trip with us.

Your feedback helps us improve! Please take a moment to rate your experience:
{feedback_link}

As a thank you, get ₹100 off your next booking!

TransRentals`,
    variables: ['customer_name', 'feedback_link'],
    usageCount: 98,
  },
];

// Recent communications
const recentMessages = [
  { id: 1, customer: 'Rajesh Kumar', phone: '+91 9737965551', template: 'Booking Confirmation', sentAt: '2024-01-18 10:30', status: 'delivered', channel: 'whatsapp' },
  { id: 2, customer: 'Priya Sharma', phone: '+91 97379 65551', template: 'Payment Reminder', sentAt: '2024-01-18 09:15', status: 'read', channel: 'whatsapp' },
  { id: 3, customer: 'Tech Solutions', phone: '+91 97379 65551', template: 'Quotation Sent', sentAt: '2024-01-17 16:45', status: 'delivered', channel: 'whatsapp' },
  { id: 4, customer: 'Mohammed Ali', phone: '+91 97379 65551', template: 'Trip Started', sentAt: '2024-01-17 14:20', status: 'delivered', channel: 'sms' },
  { id: 5, customer: 'Arun Deshmukh', phone: '+91 97379 65551', template: 'Trip Completed', sentAt: '2024-01-17 11:00', status: 'read', channel: 'whatsapp' },
];

// Scheduled messages
const scheduledMessages = [
  { id: 1, customer: 'Kavita Joshi', template: 'Birthday Wish', scheduledFor: '2024-01-20 09:00', channel: 'whatsapp' },
  { id: 2, customer: 'Bulk - All Customers', template: 'Festival Offer', scheduledFor: '2024-01-26 10:00', channel: 'whatsapp', recipients: 156 },
];

export default function CommunicationPage() {
  const [selectedTab, setSelectedTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof messageTemplates[0] | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categories = ['all', 'Booking', 'Payment', 'Trip Update', 'Sales', 'Marketing', 'Feedback'];

  const filteredTemplates = messageTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (id: number, message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-blue-600';
      case 'read': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-600">Manage message templates and customer communications</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">WhatsApp Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">1,245</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">SMS Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">456</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Templates</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{messageTemplates.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active templates</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{scheduledMessages.length}</p>
          <p className="text-xs text-gray-500 mt-1">Pending messages</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'Message History', icon: Clock },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
          { id: 'bulk', label: 'Bulk Send', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${selectedTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {selectedTab === 'templates' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${categoryFilter === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${template.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {template.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </span>
                        <span className="text-xs text-gray-500">{template.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(template.id, template.message)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        title="Copy"
                      >
                        {copiedId === template.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{template.message}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{template.variables.length} variables</span>
                    <span>Used {template.usageCount} times</span>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={() => { setSelectedTemplate(template); setShowSendModal(true); }}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Send Now
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-white transition flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Schedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Message History Tab */}
      {selectedTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Template</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Channel</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Sent At</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentMessages.map(msg => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{msg.customer}</p>
                        <p className="text-sm text-gray-500">{msg.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{msg.template}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${msg.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {msg.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{msg.sentAt}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getStatusColor(msg.status)}`}>
                        {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Resend">
                        <Send className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {selectedTab === 'scheduled' && (
        <div className="space-y-4">
          {scheduledMessages.map(msg => (
            <div key={msg.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${msg.channel === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                  {msg.channel === 'whatsapp' ? (
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{msg.template}</p>
                  <p className="text-sm text-gray-500">
                    To: {msg.customer}
                    {msg.recipients && ` (${msg.recipients} recipients)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Scheduled for</p>
                  <p className="font-medium text-gray-900">{msg.scheduledFor}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Edit">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg transition" title="Cancel">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {scheduledMessages.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No scheduled messages</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Send Tab */}
      {selectedTab === 'bulk' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Send Bulk Messages
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'All Customers', count: 456, icon: Users },
                  { label: 'Active This Month', count: 89, icon: Star },
                  { label: 'Corporate', count: 34, icon: FileText },
                  { label: 'VIP Customers', count: 12, icon: Star },
                ].map(group => (
                  <button
                    key={group.label}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                  >
                    <group.icon className="w-5 h-5 text-gray-400 mb-2" />
                    <p className="font-medium text-gray-900">{group.label}</p>
                    <p className="text-sm text-gray-500">{group.count} contacts</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Choose a template</option>
                {messageTemplates.filter(t => t.category === 'Marketing').map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Now
              </button>
              <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
                <button onClick={() => setShowSendModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{selectedTemplate.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone</label>
                <input
                  type="tel"
                  placeholder="+91 9737965551"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fill Variables</label>
                <div className="space-y-2">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-xs text-gray-500 mb-1">{`{${variable}}`}</label>
                      <input
                        type="text"
                        placeholder={variable.replace(/_/g, ' ')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm whitespace-pre-line">
                  {selectedTemplate.message}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send via {selectedTemplate.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
