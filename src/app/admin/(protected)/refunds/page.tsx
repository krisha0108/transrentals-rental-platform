// The refunds desk. Managers get the same queue at /manager/refunds — one
// component, so the two never drift apart.
import RefundsQueue from '@/components/admin/refunds/RefundsQueue';

export default function AdminRefundsPage() {
  return <RefundsQueue />;
}
