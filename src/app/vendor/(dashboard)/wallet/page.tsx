'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  IndianRupee,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCcw,
  Gift,
  Percent,
  Users,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'withdrawal' | 'refund' | 'bonus' | 'referral';
  amount: number;
  description: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  time: string;
  balanceAfter: number;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  isPrimary: boolean;
  verified: boolean;
}

// Mock transactions
const mockTransactions: Transaction[] = [
  {
    id: 'T001',
    type: 'credit',
    amount: 15000,
    description: 'Booking Payment - BK-2024-0156',
    reference: 'PAY-2024-001234',
    status: 'completed',
    date: '2024-01-20',
    time: '14:30:00',
    balanceAfter: 125000
  },
  {
    id: 'T002',
    type: 'withdrawal',
    amount: 50000,
    description: 'Bank Transfer - ICICI Bank ****4567',
    reference: 'WDR-2024-000089',
    status: 'completed',
    date: '2024-01-18',
    time: '10:00:00',
    balanceAfter: 110000
  },
  {
    id: 'T003',
    type: 'credit',
    amount: 8500,
    description: 'Booking Payment - BK-2024-0152',
    reference: 'PAY-2024-001189',
    status: 'completed',
    date: '2024-01-17',
    time: '16:45:00',
    balanceAfter: 160000
  },
  {
    id: 'T004',
    type: 'referral',
    amount: 500,
    description: 'Referral Bonus - New Vendor Joined',
    reference: 'REF-2024-000045',
    status: 'completed',
    date: '2024-01-16',
    time: '12:00:00',
    balanceAfter: 151500
  },
  {
    id: 'T005',
    type: 'debit',
    amount: 1500,
    description: 'Platform Commission - January Week 3',
    reference: 'COM-2024-000023',
    status: 'completed',
    date: '2024-01-15',
    time: '00:00:00',
    balanceAfter: 151000
  },
  {
    id: 'T006',
    type: 'withdrawal',
    amount: 25000,
    description: 'Bank Transfer - HDFC Bank ****8901',
    reference: 'WDR-2024-000078',
    status: 'pending',
    date: '2024-01-20',
    time: '16:00:00',
    balanceAfter: 100000
  },
  {
    id: 'T007',
    type: 'bonus',
    amount: 2000,
    description: 'Performance Bonus - High Rating',
    reference: 'BON-2024-000012',
    status: 'completed',
    date: '2024-01-14',
    time: '18:00:00',
    balanceAfter: 152500
  }
];

// Mock bank accounts
const mockBankAccounts: BankAccount[] = [
  {
    id: 'BA001',
    bankName: 'ICICI Bank',
    accountNumber: '****4567',
    ifsc: 'ICIC0001234',
    accountHolder: 'TransRentals Pvt Ltd',
    isPrimary: true,
    verified: true
  },
  {
    id: 'BA002',
    bankName: 'HDFC Bank',
    accountNumber: '****8901',
    ifsc: 'HDFC0005678',
    accountHolder: 'TransRentals Pvt Ltd',
    isPrimary: false,
    verified: true
  }
];

const transactionTypeConfig = {
  credit: { label: 'Credit', color: 'text-green-600', bgColor: 'bg-green-100', icon: ArrowDownRight },
  debit: { label: 'Debit', color: 'text-red-600', bgColor: 'bg-red-100', icon: ArrowUpRight },
  withdrawal: { label: 'Withdrawal', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: ArrowUpRight },
  refund: { label: 'Refund', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: ArrowDownRight },
  bonus: { label: 'Bonus', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Gift },
  referral: { label: 'Referral', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Users }
};

export default function WalletPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [bankAccounts] = useState<BankAccount[]>(mockBankAccounts);
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals' | 'bank'>('transactions');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Calculate stats
  const walletBalance = 125000;
  const pendingWithdrawals = 25000;
  const thisMonthEarnings = transactions
    .filter(t => t.type === 'credit' && t.date.startsWith('2024-01'))
    .reduce((sum, t) => sum + t.amount, 0);
  const thisMonthCommission = transactions
    .filter(t => t.type === 'debit' && t.date.startsWith('2024-01'))
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your earnings and withdrawals</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Download Statement
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-sm bg-white/20 px-2 py-1 rounded">Available</span>
          </div>
          <p className="text-3xl font-bold">₹{walletBalance.toLocaleString()}</p>
          <p className="text-white/70 text-sm mt-1">Wallet Balance</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Processing</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{pendingWithdrawals.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Pending Withdrawals</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{thisMonthEarnings.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Total Earnings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Percent className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{thisMonthCommission.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Platform Commission</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {[
              { id: 'transactions', label: 'All Transactions', icon: RefreshCcw },
              { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
              { id: 'bank', label: 'Bank Accounts', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
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

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="bonus">Bonuses</option>
                  <option value="referral">Referrals</option>
                </select>
              </div>
            </div>

            {/* Transaction List */}
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map(txn => {
                const config = transactionTypeConfig[txn.type];
                const TxnIcon = config.icon;
                const isCredit = ['credit', 'bonus', 'referral', 'refund'].includes(txn.type);

                return (
                  <div key={txn.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <TxnIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{txn.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{txn.reference}</span>
                            <span>•</span>
                            <span>{new Date(txn.date).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-lg font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString()}
                        </p>
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Bank Accounts Tab */}
        {activeTab === 'bank' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Linked Bank Accounts</h3>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>

            <div className="space-y-4">
              {bankAccounts.map(account => (
                <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{account.bankName}</h4>
                          {account.isPrimary && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Primary</span>
                          )}
                          {account.verified && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">A/C: {account.accountNumber} | IFSC: {account.ifsc}</p>
                        <p className="text-sm text-gray-500">{account.accountHolder}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="divide-y divide-gray-100">
            {transactions.filter(t => t.type === 'withdrawal').map(txn => (
              <div key={txn.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ArrowUpRight className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{txn.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{txn.reference}</span>
                        <span>•</span>
                        <span>{new Date(txn.date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{txn.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                      txn.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {txn.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">×</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-600">Available Balance</p>
                <p className="text-3xl font-bold text-gray-900">₹{walletBalance.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[10000, 25000, 50000].map(amount => (
                    <button key={amount} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer To</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber} {account.isPrimary ? '(Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <p>• Withdrawals are processed within 24-48 hours</p>
                <p>• Minimum withdrawal amount: ₹1,000</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
