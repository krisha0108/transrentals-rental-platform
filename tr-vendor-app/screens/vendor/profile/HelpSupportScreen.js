import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BRAND = {
  primary: '#22C55E',
  blue: '#3B82F6',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
};

const FAQ_DATA = [
  {
    question: 'How do I add my vehicles?',
    answer: 'Go to Fleet → Add Vehicle and fill in the vehicle details. Upload clear photos and all required documents for faster approval.',
  },
  {
    question: 'How long does approval take?',
    answer: 'Document verification typically takes 24-48 hours. Service and location requests are reviewed within 1-2 business days.',
  },
  {
    question: 'How do I receive bookings?',
    answer: 'Once approved, you\'ll receive booking notifications. You can view and respond to bookings in the Bookings section.',
  },
  {
    question: 'What are the commission charges?',
    answer: 'Commission charges vary by service type and location. Please check your vendor agreement or contact support for details.',
  },
  {
    question: 'How do I update my bank details?',
    answer: 'Go to Profile → Bank Details to add or update your bank account information for receiving payments.',
  },
  {
    question: 'Can I operate in multiple cities?',
    answer: 'Yes! Go to Locations and request approval for additional cities where you want to operate.',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const contactOptions = [
    {
      icon: 'call',
      label: 'Call Us',
      value: '+91-9737965551',
      action: () => Linking.openURL('tel:+919737965551'),
      color: BRAND.primary,
    },
    {
      icon: 'mail',
      label: 'Email Us',
      value: 'book@transrentals.in',
      action: () => Linking.openURL('mailto:book@transrentals.in'),
      color: BRAND.blue,
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp',
      value: '+91-9737965551',
      action: () => Linking.openURL('https://wa.me/919737965551'),
      color: '#25D366',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={BRAND.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={option.action}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={24} color={option.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{option.label}</Text>
                <Text style={styles.contactValue}>{option.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.subText} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_DATA.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={BRAND.subText}
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Hours */}
        <View style={styles.infoCard}>
          <Ionicons name="time" size={20} color={BRAND.blue} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Support Hours</Text>
            <Text style={styles.infoText}>We're available 24/7 to assist you</Text>
            <Text style={styles.infoText}>Monday to Sunday: Round the Clock Support</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.card,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.ink,
  },

  scrollContent: {
    padding: 16,
  },

  section: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 16,
  },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: BRAND.subText,
  },

  faqCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginRight: 8,
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: BRAND.subText,
    lineHeight: 20,
  },

  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND.ink,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: BRAND.text,
    marginBottom: 2,
  },
});
