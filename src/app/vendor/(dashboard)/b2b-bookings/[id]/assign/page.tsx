'use client';

import { useParams, redirect } from 'next/navigation';

export default function B2BAssignRedirect() {
  const params = useParams();
  redirect(`/vendor/b2b-bookings/${params.id}/quote`);
}
