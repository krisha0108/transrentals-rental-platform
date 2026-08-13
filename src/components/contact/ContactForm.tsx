'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { User, Phone as PhoneIcon, Mail as MailIcon, Tag, PenLine, Send } from 'lucide-react';
import { trackFormSubmission } from '@/components/analytics/VisitorTracker';
import { useCustomerAuth } from '@/hooks/useCustomer';
import ContactSuccessModal from './ContactSuccessModal';

type ContactFormField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
  gridClass?: string;
  icon?: typeof User;
};

const contactFormFields: ContactFormField[] = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    gridClass: 'md:col-span-1',
    icon: User,
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: 'Enter your phone number',
    required: true,
    gridClass: 'md:col-span-1',
    icon: PhoneIcon,
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email address',
    required: true,
    gridClass: 'md:col-span-2',
    icon: MailIcon,
  },
  {
    name: 'subject',
    label: 'Subject',
    type: 'text',
    placeholder: "What's this about?",
    required: true,
    gridClass: 'md:col-span-2',
    icon: Tag,
  },
  {
    name: 'message',
    label: 'Message',
    type: 'textarea',
    placeholder: 'Tell us more about your query...',
    required: true,
    rows: 5,
    gridClass: 'md:col-span-2',
    icon: PenLine,
  },
];

const initialContactFormValues = contactFormFields.reduce<Record<string, string>>(
  (acc, field) => ({ ...acc, [field.name]: '' }),
  {}
);

export function ContactForm() {
  const [formData, setFormData] = useState(initialContactFormValues);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    referenceNumber: string;
    name: string;
    email: string;
    phone: string;
    isExistingCustomer: boolean;
  } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useCustomerAuth();
  const formStartTimeRef = useRef<number>(Date.now());
  // A ref (not formStatus state) guards re-entrance: state updates are
  // async, so two synchronous clicks before the first re-render both read
  // formStatus === 'idle' and both submit — which was firing duplicate
  // manager notifications for one contact-form message.
  const isSubmittingRef = useRef(false);

  // Reset form start time when component mounts
  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const handleFormChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setFormStatus('submitting');
    setFormMessage('');

    // Calculate time to fill
    const timeToFill = Math.round((Date.now() - formStartTimeRef.current) / 1000);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage =
          payload?.error || `Unable to send message (status ${response.status})`;
        throw new Error(errorMessage);
      }

      const successPayload = await response.json().catch(() => null);

      // Track successful submission
      await trackFormSubmission({
        formType: 'CONTACT',
        formName: 'ContactForm',
        pagePath: pathname,
        pageTitle: document.title,
        status: 'SUBMITTED',
        timeToFill,
      });

      isSubmittingRef.current = false;
      setFormStatus('success');
      setFormData(initialContactFormValues);

      if (isAuthenticated) {
        // Already logged in — no point asking them to log in again. Show a
        // quick confirmation, then send them straight to their dashboard.
        setFormMessage(
          `Thanks for reaching out! Reference ${successPayload?.referenceNumber || ''} — redirecting you to your dashboard...`
        );
        setTimeout(() => router.push('/customer/dashboard'), 1200);
      } else {
        setFormMessage('Thanks for reaching out! We will reply within one business day.');
        if (successPayload?.referenceNumber) {
          setSuccessInfo({
            referenceNumber: successPayload.referenceNumber,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            isExistingCustomer: !!successPayload.isExistingCustomer,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';

      // Track failed submission
      await trackFormSubmission({
        formType: 'CONTACT',
        formName: 'ContactForm',
        pagePath: pathname,
        pageTitle: document.title,
        status: 'FAILED',
        errorMessage: message,
        timeToFill,
      });

      isSubmittingRef.current = false;
      setFormStatus('error');
      setFormMessage(message);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Send Us a Message
          </h2>
        </div>
        <form className="space-y-5" onSubmit={handleContactFormSubmit}>
          <div className="grid md:grid-cols-2 gap-5">
            {contactFormFields.map((field) => {
              const Icon = field.icon;
              return (
                <div
                  key={field.name}
                  className={`${field.gridClass ?? 'md:col-span-1'} space-y-1.5`}
                >
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <div className="relative">
                      {Icon && <Icon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />}
                      <textarea
                        id={field.name}
                        name={field.name}
                        rows={field.rows ?? 4}
                        value={formData[field.name]}
                        onChange={(event) =>
                          handleFormChange(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white resize-none text-sm transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type ?? 'text'}
                        value={formData[field.name]}
                        onChange={(event) =>
                          handleFormChange(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        required={field.required}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white text-sm transition-colors"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={formStatus === 'submitting'}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-70"
          >
            <Send className="w-4 h-4" />
            {formStatus === 'submitting' ? 'Sending...' : 'Send Message'}
          </button>
          {formMessage && (
            <p
              className={`text-sm text-center ${
                formStatus === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formMessage}
            </p>
          )}
        </form>
      </div>
      {successInfo && (
        <ContactSuccessModal
          {...successInfo}
          onClose={() => setSuccessInfo(null)}
        />
      )}
    </div>
  );
}
