import { redirect } from 'next/navigation';

export default function ContactInquiryDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/manager/helpdesk/inquiries/${params.id}`);
}
