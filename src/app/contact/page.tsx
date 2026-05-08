import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { ContactForm } from '@/components/contact/ContactForm';
import {
  CONTACT_ADDRESS,
  CONTACT_ADDRESS_LINK,
  WHATSAPP_LINK,
} from '@/lib/contact';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
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
    value: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91-9737965551',
    link: `tel:${process.env.NEXT_PUBLIC_CONTACT_PHONE}`,
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
    icon: MessageCircle,
    title: 'WhatsApp',
    value: 'WhatsApp Support',
    link: WHATSAPP_LINK,
    description: 'Chat with us',
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
    telephone: '+91-9737965551',
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
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl md:text-2xl opacity-90">
              We're here to help! Reach out to us anytime
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <method.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {method.title}
                </h3>
                {method.link ? (
                  <a
                    href={method.link}
                    className="text-primary font-semibold hover:underline block mb-1"
                  >
                    {method.value}
                  </a>
                ) : (
                  <p className="text-primary font-semibold mb-1">{method.value}</p>
                )}
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <ContactForm />
        </div>
      </section>

      {/* FAQ Link */}
      <section className="py-16 bg-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Check out our frequently asked questions for quick answers
          </p>
          <a
            href="/faq"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            View FAQ
          </a>
        </div>
      </section>
    </>
  );
}
