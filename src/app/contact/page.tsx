import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { ContactForm } from '@/components/contact/ContactForm';
import {
  CONTACT_ADDRESS,
  CONTACT_ADDRESS_LINK,
  CONTACT_PHONE,
  CONTACT_PHONE_LINK,
  WHATSAPP_LINK,
} from '@/lib/contact';
import { Phone, Mail, MapPin, MessageCircle, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { WebPageSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch | TransRentals',
  description:
    'Contact TransRentals for any queries, support, or assistance. We are available 24/7 to help you with your vehicle rental needs.',
};

const contactMethods = [
  {
    icon: Phone,
    title: 'Phone',
    value: CONTACT_PHONE,
    link: CONTACT_PHONE_LINK,
    description: 'Call us anytime',
  },
  {
    icon: Mail,
    title: 'Email',
    value: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'book@transrentals.in',
    link: `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`,
    description: 'Send us an email',
  },
  {
    icon: MapPin,
    title: 'Address',
    value: CONTACT_ADDRESS,
    link: CONTACT_ADDRESS_LINK,
    description: 'Visit us in Ahmedabad',
  },
  {
    icon: Clock,
    title: 'Coverage',
    value: '150+ Cities',
    description: 'Across India',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: "We're available 24/7 to assist you",
    description: 'Monday to Sunday: Round the Clock Support',
  },
];

const contactSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact TransRentals',
  description: 'Contact TransRentals for vehicle rental queries and support.',
  url: 'https://transrentals.in/contact',
  mainEntity: {
    '@type': 'Organization',
    name: 'TransRentals',
    email: 'book@transrentals.in',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '215, Galaxy Business, 2nd Floor, SP Ring Road',
      addressLocality: 'Ahmedabad',
      addressRegion: 'Gujarat',
      postalCode: '382350',
      addressCountry: 'IN',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-sky-50 via-white to-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 bg-no-repeat bg-right bg-cover"
            style={{ backgroundImage: "url('/images/sections/contact-hero-bg.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent md:via-white/30" />
          <div className="absolute -bottom-24 -left-24 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container-custom pt-24 md:pt-28 pb-14">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
              CONTACT US
            </h1>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              We&apos;re here to <span className="text-emerald-600">help!</span> Reach out to us anytime
            </p>
            <p className="text-gray-500 max-w-md">
              Have questions about our vehicle rental services? Our team is ready to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form + Methods */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Contact Form (50%) */}
            <ContactForm />

            {/* Right: Contact Methods (50%) */}
            <div className="space-y-5">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full">
                    <method.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {method.title}
                    </h3>
                    {method.link ? (
                      <a
                        href={method.link}
                        className="text-emerald-700 font-semibold hover:underline block mb-1"
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="text-emerald-700 font-semibold mb-1">{method.value}</p>
                    )}
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ CTA */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="hidden sm:flex w-14 h-14 rounded-full bg-emerald-50 items-center justify-center shrink-0">
                <HelpCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Have Questions?</h2>
                <p className="text-gray-500 text-sm">
                  Check out our frequently asked questions for quick answers
                </p>
              </div>
            </div>
            <a
              href="/faq"
              className="inline-flex items-center gap-2 border-2 border-emerald-600 text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shrink-0"
            >
              View FAQ
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
