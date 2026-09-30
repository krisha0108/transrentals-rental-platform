// Managers work the same refunds queue as admins; /api/admin/refunds already
// admits the MANAGER role.
import RefundsQueue from '@/components/admin/refunds/RefundsQueue';

export default function ManagerRefundsPage() {
  return <RefundsQueue />;
}
