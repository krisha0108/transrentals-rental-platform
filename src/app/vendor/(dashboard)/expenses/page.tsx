'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  IndianRupee,
  Car,
  Fuel,
  Wrench,
  FileText,
  Users,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  XCircle,
  Receipt,
  Camera,
  Tag,
} from 'lucide-react';

// Expense categories
const expenseCategories = [
  { id: 'fuel', name: 'Fuel & Diesel', icon: Fuel, color: 'orange' },
  { id: 'maintenance', name: 'Maintenance & Repairs', icon: Wrench, color: 'blue' },
  { id: 'salary', name: 'Salary & Wages', icon: Users, color: 'green' },
  { id: 'insurance', name: 'Insurance', icon: FileText, color: 'purple' },
  { id: 'rent', name: 'Office & Rent', icon: Building2, color: 'pink' },
  { id: 'vehicle', name: 'Vehicle Expenses', icon: Car, color: 'cyan' },
  { id: 'supplies', name: 'Supplies & Tools', icon: Package, color: 'yellow' },
  { id: 'other', name: 'Other Expenses', icon: Wallet, color: 'gray' },
];

// Mock expenses data
const expensesData = [
  {
    id: 'EXP001',
    date: '2024-01-18',
    category: 'fuel',
    description: 'Diesel for MH04AB1234',
    amount: 8500,
    paymentMode: 'UPI',
    vehicleId: 'MH04AB1234',
    vendor: 'HP Petrol Pump, Andheri',
    receipt: true,
    notes: '50 litres',
    approvedBy: 'Self',
  },
  {
    id: 'EXP002',
    date: '2024-01-17',
    category: 'maintenance',
    description: 'Tyre replacement - MH04CD5678',
    amount: 24000,
    paymentMode: 'Cash',
    vehicleId: 'MH04CD5678',
    vendor: 'MRF Tyre Centre',
    receipt: true,
    notes: '4 new tyres',
    approvedBy: 'Manager',
  },
  {
    id: 'EXP003',
    date: '2024-01-16',
    category: 'salary',
    description: 'Driver salary - Ramesh (January)',
    amount: 25000,
    paymentMode: 'Bank Transfer',
    vendor: 'Ramesh Kumar',
    receipt: false,
    notes: 'Monthly salary',
    approvedBy: 'Self',
  },
  {
    id: 'EXP004',
    date: '2024-01-15',
    category: 'insurance',
    description: 'Vehicle insurance renewal - MH04EF9012',
    amount: 45000,
    paymentMode: 'Cheque',
    vehicleId: 'MH04EF9012',
    vendor: 'ICICI Lombard',
    receipt: true,
    notes: 'Comprehensive insurance',
    approvedBy: 'Self',
  },
  {
    id: 'EXP005',
    date: '2024-01-14',
    category: 'fuel',
    description: 'Diesel for MH04GH3456',
    amount: 12000,
    paymentMode: 'Card',
    vehicleId: 'MH04GH3456',
    vendor: 'Indian Oil, Powai',
    receipt: true,
    notes: '70 litres',
    approvedBy: 'Self',
  },
  {
    id: 'EXP006',
    date: '2024-01-13',
    category: 'rent',
    description: 'Office rent - January 2024',
    amount: 35000,
    paymentMode: 'Bank Transfer',
    vendor: 'ABC Properties',
    receipt: true,
    notes: 'Monthly rent',
    approvedBy: 'Self',
  },
  {
    id: 'EXP007',
    date: '2024-01-12',
    category: 'maintenance',
    description: 'AC service - MH04AB1234',
    amount: 3500,
    paymentMode: 'Cash',
    vehicleId: 'MH04AB1234',
    vendor: 'Car Service Center',
    receipt: true,
    notes: 'AC gas refill',
    approvedBy: 'Manager',
  },
  {
    id: 'EXP008',
    date: '2024-01-11',
    category: 'salary',
    description: 'Driver salary - Suresh (January)',
    amount: 22000,
    paymentMode: 'Bank Transfer',
    vendor: 'Suresh Patil',
    receipt: false,
    notes: 'Monthly salary',
    approvedBy: 'Self',
  },
  {
    id: 'EXP009',
    date: '2024-01-10',
    category: 'supplies',
    description: 'Cleaning supplies for vehicles',
    amount: 2500,
    paymentMode: 'Cash',
    vendor: 'Local Shop',
    receipt: true,
    notes: 'Car wash supplies',
    approvedBy: 'Self',
  },
  {
    id: 'EXP010',
    date: '2024-01-09',
    category: 'vehicle',
    description: 'Fastag recharge - All vehicles',
    amount: 10000,
    paymentMode: 'UPI',
    vendor: 'Paytm',
    receipt: true,
    notes: 'Fastag top-up',
    approvedBy: 'Self',
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(expensesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    paymentMode: '',
    vehicleId: '',
    vendor: '',
    notes: '',
  });

  const getCategoryInfo = (categoryId: string) => {
    return expenseCategories.find(c => c.id === categoryId) || expenseCategories[7];
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = expenseCategories.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  const thisMonthExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const avgDailyExpense = Math.round(thisMonthExpenses / 18); // Assuming 18 days

  const handleAddExpense = () => {
    const expense = {
      id: `EXP${String(expenses.length + 1).padStart(3, '0')}`,
      ...newExpense,
      amount: Number(newExpense.amount),
      receipt: false,
      approvedBy: 'Self',
    };
    setExpenses([expense, ...expenses]);
    setShowAddModal(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      paymentMode: '',
      vehicleId: '',
      vendor: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600">Track and manage all business expenses</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{(totalExpenses / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Fuel className="w-4 h-4" />
            <span className="text-sm">Fuel Expenses</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            ₹{(categoryTotals.find(c => c.id === 'fuel')?.total || 0 / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">{Math.round(((categoryTotals.find(c => c.id === 'fuel')?.total || 0) / totalExpenses) * 100)}% of total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Wrench className="w-4 h-4" />
            <span className="text-sm">Maintenance</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            ₹{((categoryTotals.find(c => c.id === 'maintenance')?.total || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">{Math.round(((categoryTotals.find(c => c.id === 'maintenance')?.total || 0) / totalExpenses) * 100)}% of total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Daily Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{avgDailyExpense.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Per day</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Expense by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryTotals.filter(c => c.total > 0).map(category => {
            const Icon = category.icon;
            const percentage = Math.round((category.total / totalExpenses) * 100);
            return (
              <div
                key={category.id}
                className={`p-4 rounded-lg border cursor-pointer transition hover:shadow-md ${categoryFilter === category.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setCategoryFilter(categoryFilter === category.id ? 'all' : category.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 text-${category.color}-600`} />
                  <span className="text-sm text-gray-600">{category.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">₹{category.total.toLocaleString()}</p>
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${category.color}-500 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {expenseCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vendor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.map((expense) => {
                const category = getCategoryInfo(expense.category);
                const Icon = category.icon;
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{expense.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-700`}>
                        <Icon className="w-3 h-3" />
                        {category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      {expense.notes && <p className="text-xs text-gray-500">{expense.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{expense.vendor}</td>
                    <td className="px-4 py-3">
                      {expense.vehicleId ? (
                        <span className="text-blue-600 font-medium">{expense.vehicleId}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{expense.paymentMode}</span>
                    </td>
                    <td className="px-4 py-3">
                      {expense.receipt ? (
                        <span className="text-green-600">
                          <Receipt className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          <Receipt className="w-4 h-4" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="What was this expense for?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                  <select
                    value={newExpense.paymentMode}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select mode</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Payee</label>
                <input
                  type="text"
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  placeholder="Who did you pay?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (if applicable)</label>
                <input
                  type="text"
                  value={newExpense.vehicleId}
                  onChange={(e) => setNewExpense({ ...newExpense, vehicleId: e.target.value })}
                  placeholder="e.g., MH04AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Receipt</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or take photo</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                </div>
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
                onClick={handleAddExpense}
                disabled={!newExpense.date || !newExpense.category || !newExpense.description || !newExpense.amount || !newExpense.paymentMode}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
