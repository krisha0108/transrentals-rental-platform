'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface B2BServiceNoteProps {
  serviceName: string;
}

export function B2BServiceNote({ serviceName }: B2BServiceNoteProps) {
  const [isB2B, setIsB2B] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('customer');
      if (!raw) return;
      const customer = JSON.parse(raw);
      const params = new URLSearchParams();
      if (customer?.id) params.set('customer_id', customer.id);
      if (customer?.email) params.set('email', customer.email);
      if (!params.toString()) return;
      fetch(`/api/customer/b2b-status?${params.toString()}`)
        .then(r => r.json())
        .then(d => { if (d.isB2B) setIsB2B(true); })
        .catch(() => {});
    } catch {}
  }, []);

  if (!isB2B) return null;

  return (
    <div className="container-custom py-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800">Advance Payment Required</p>
          <p className="text-sm text-amber-700 mt-0.5">
            {serviceName} is <strong>not covered under your B2B corporate agreement</strong>. This booking will require advance payment before confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
