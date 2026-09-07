'use client';

import { useParams } from 'next/navigation';
import { CallReportForm } from '../../_components/CallReportForm';

export default function EditCallReportPage() {
  const params = useParams();
  const id = params?.id as string;
  return <CallReportForm reportId={id} />;
}
