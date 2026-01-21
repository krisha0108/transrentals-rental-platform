import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AboutUsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Compact Hero Section */}
        <View style={styles.heroSection}>
          <Image 
            source={require('../assets/logp-1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>TransRentals</Text>
          <Text style={styles.heroSubtitle}>Vehicle Rental Solutions Since 2015</Text>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Mission Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="business" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Our Story</Text>
            </View>
            <Text style={styles.cardText}>
              Started in 2015, we are a vehicle rental aggregator offering
              on-demand vehicle rental solutions to cater to all your vehicle
              requirements. Whether you are a corporate or ordinary individual, 
              we serve all. We are here to deliver the best vehicle rental service
              possible.
            </Text>
          </View>

          {/* Vision Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="eye" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Our Vision</Text>
            </View>
            <Text style={styles.cardText}>
              We know that the need for transportation is evolving day by day, 
              so we travel the extra mile to help you get where you are going 
              or transporting goods the best way possible—no matter what kind 
              of vehicle you need or for how long.
            </Text>
          </View>

          {/* Philosophy Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="heart" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Our Philosophy</Text>
            </View>
            <Text style={styles.cardText}>
              At TransRentals, we believe that transportation is an essential part
              of our life, whether passenger or goods transportation. We want to
              make this part of life more convenient and accessible so you can
              concentrate on more important things.
            </Text>
            <Text style={[styles.cardText, styles.quoteText]}>
              "Keep Moving, Keep Growing"
            </Text>
          </View>

          {/* Compact Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>9+</Text>
              <Text style={styles.statLabel}>Years Experience</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>All</Text>
              <Text style={styles.statLabel}>Vehicle Types</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Legal Section */}
        <View style={styles.footerSection}>
          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>Legal & Policies</Text>
            
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => Linking.openURL('https://transrentals.in/privacy-policy/')}>
              <View style={styles.linkIconContainer}>
                <Icon name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Text style={styles.linkDescription}>How we protect your data</Text>
              </View>
              <Icon name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => Linking.openURL('https://transrentals.in/terms-conditions/')}>
              <View style={styles.linkIconContainer}>
                <Icon name="document-text" size={18} color="#10B981" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkText}>Terms & Conditions</Text>
                <Text style={styles.linkDescription}>User agreement and guidelines</Text>
              </View>
              <Icon name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => Linking.openURL('https://transrentals.in/')}>
              <View style={styles.linkIconContainer}>
                <Icon name="globe" size={18} color="#10B981" />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkText}>Website</Text>
                <Text style={styles.linkDescription}>Visit our main website</Text>
              </View>
              <Icon name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Contact Information */}
          {/* <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Get In Touch</Text>
            <View style={styles.contactItems}>
              <View style={styles.contactItem}>
                <Icon name="mail" size={16} color="#6B7280" />
                <Text style={styles.contactText}>support@transrentals.in</Text>
              </View>
              <View style={styles.contactItem}>
                <Icon name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>+91 XXXXXXXXXX</Text>
              </View>
            </View>
          </View> */}

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>TransRentals © 2024</Text>
            <Text style={styles.versionSubtext}>All rights reserved</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Compact Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  contentSection: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  quoteText: {
    fontStyle: 'italic',
    color: '#10B981',
    fontWeight: '500',
    marginTop: 8,
  },
  // Compact Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F3F4F6',
    alignSelf: 'center',
  },
  footerSection: {
    padding: 20,
  },
  // Enhanced Legal Section
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  // Contact Section
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  contactItems: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
  },
});