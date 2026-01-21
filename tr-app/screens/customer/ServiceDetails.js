// screens/customer/services/ServiceDetails.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import api from '../api';

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;
const SLIDE_INTERVAL = 3500;

const ServiceDetails = ({ route, navigation }) => {
  const { serviceId } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("inclusion"); // Default active tab
  const scrollRef = useRef(null);
  const autoScrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchService(serviceId);
    return stopAutoScroll;
  }, [serviceId]);

  useEffect(() => {
    if (!loading && service) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, service]);

  const fetchService = async (id) => {
    try {
      const res = await api.get(`/vendor-services/${id}`);
      const json = res.data;
      if (json?.success) setService(json.service);
      else setService(json?.data || json?.service || null);
    } catch (e) {
      console.log("❌ Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      if (service?.images?.length > 1) {
        const next = (activeIndex + 1) % service.images.length;
        scrollRef.current.scrollTo({ x: next * width, animated: true });
        setActiveIndex(next);
      }
    }, SLIDE_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  };

  const formatList = (text) => {
    if (!text) return ["Not specified"];
    return text.split(/[.,]/).map((t) => t.trim()).filter(Boolean);
  };

  const renderTerms = (text) => {
    if (!text) return <Text style={styles.tcText}>Not specified</Text>;
    return text
      .split(",")
      .map((line, i) => (
        <Text key={i} style={styles.tcText}>
          {line.trim()}
        </Text>
      ));
  };

  // Tab configuration with individual colors
  const tabs = [
    { 
      id: "inclusion", 
      label: "Inclusions", 
      icon: "checkmark-circle",
      activeColor: "#27AE60",
      lightColor: "#f5f4f4ff"
    },
    { 
      id: "exclusion", 
      label: "Exclusions", 
      icon: "close-circle",
      activeColor: "#E74C3C",
      lightColor: "#f5f4f4ff"
    },
    { 
      id: "terms", 
      label: "Terms", 
      icon: "document-text",
      activeColor: "#2980B9",
      lightColor: "#f5f4f4ff"
    },
    { 
      id: "cancellation", 
      label: "Cancellation", 
      icon: "refresh-circle",
      activeColor: "#F39C12",
      lightColor: "#f5f4f4ff"
    },
  ];

  // Get active tab color
  const getActiveTabColor = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    return activeTabConfig ? activeTabConfig.activeColor : "#FF6B35";
  };

  // Render content based on active tab
  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    
    switch (activeTab) {
      case "inclusion":
        return (
          <View style={styles.tabContent}>
            <View style={[styles.tabHeader, { backgroundColor: activeTabConfig.lightColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="checkmark-circle" size={20} color={activeTabConfig.activeColor} />
              </View>
              <View>
                <Text style={[styles.tabTitle, { color: activeTabConfig.activeColor }]}>What's Included</Text>
                <Text style={styles.tabSubtitle}>All services covered in this package</Text>
              </View>
            </View>
            <View style={styles.contentList}>
              {formatList(service.inclusion).map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="checkmark" size={16} color={activeTabConfig.activeColor} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case "exclusion":
        return (
          <View style={styles.tabContent}>
            <View style={[styles.tabHeader, { backgroundColor: activeTabConfig.lightColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="close-circle" size={20} color={activeTabConfig.activeColor} />
              </View>
              <View>
                <Text style={[styles.tabTitle, { color: activeTabConfig.activeColor }]}>What's Not Included</Text>
                <Text style={styles.tabSubtitle}>Additional charges may apply</Text>
              </View>
            </View>
            <View style={styles.contentList}>
              {formatList(service.exclusion).map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="close" size={16} color={activeTabConfig.activeColor} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case "terms":
        return (
          <View style={styles.tabContent}>
            <View style={[styles.tabHeader, { backgroundColor: activeTabConfig.lightColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="document-text" size={20} color={activeTabConfig.activeColor} />
              </View>
              <View>
                <Text style={[styles.tabTitle, { color: activeTabConfig.activeColor }]}>Terms & Conditions</Text>
                <Text style={styles.tabSubtitle}>Important guidelines to follow</Text>
              </View>
            </View>
            <View style={styles.contentList}>
              {renderTerms(service.terms_conditions)}
            </View>
          </View>
        );

      case "cancellation":
        return (
          <View style={styles.tabContent}>
            <View style={[styles.tabHeader, { backgroundColor: activeTabConfig.lightColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="refresh-circle" size={20} color={activeTabConfig.activeColor} />
              </View>
              <View>
                <Text style={[styles.tabTitle, { color: activeTabConfig.activeColor }]}>Cancellation Policy</Text>
                <Text style={styles.tabSubtitle}>Flexible cancellation options</Text>
              </View>
            </View>
            <View style={styles.contentList}>
              {formatList(service.cancellation_policy).map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Ionicons name="information-circle" size={16} color={activeTabConfig.activeColor} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Header background animation
  const headerBg = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['transparent', '#FFFFFF'],
    extrapolate: 'clamp',
  });

  const headerTitle = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['transparent', '#1F2937'],
    extrapolate: 'clamp',
  });

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Service Details...</Text>
      </View>
    );

  if (!service)
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>Service not found</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  const images = service.images || [];
  const price =
    service?.price ??
    service?.from_price ??
    service?.starting_price ??
    service?.min_price ??
    service?.base_price ??
    null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Fixed Header */}
      <Animated.View style={[styles.header, { backgroundColor: headerBg }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        
        <Animated.Text style={[styles.headerTitle, { color: headerTitle }]}>
          Service Details
        </Animated.Text>
        
        <View style={styles.placeholderView} />
      </Animated.View>

      <Animated.ScrollView 
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            onTouchStart={stopAutoScroll}
            onMomentumScrollEnd={startAutoScroll}
          >
            {images.length > 0 ? (
              images.map((img, i) => {
                const uri = img.startsWith("http")
                  ? img
                  : `https://app.transrentals.in/storage/${img}`;
                return (
                  <View key={i} style={styles.slide}>
                    <Image source={{ uri }} style={styles.image} />
                    <View style={styles.slideOverlay} />
                  </View>
                );
              })
            ) : (
              <View style={styles.placeholderSlide}>
                <View style={styles.placeholderContent}>
                  <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                  <Text style={styles.placeholderText}>No Image Available</Text>
                </View>
                <View style={styles.slideOverlay} />
              </View>
            )}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.sliderIndicators}>
              <View style={styles.indicatorsContainer}>
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.indicator,
                      activeIndex === i && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
              
              <View style={styles.imageCounter}>
                <Text style={styles.counterText}>
                  {activeIndex + 1} / {images.length}
                </Text>
              </View>
            </View>
          )}

          {price && (
            <View style={styles.floatingPrice}>
              <Text style={styles.priceStarts}>Starts from</Text>
              <Text style={styles.priceAmount}>₹{price}</Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Service Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.serviceName}>{service.service_name}</Text>
            {service.short_description && (
              <Text style={styles.shortDesc}>{service.short_description}</Text>
            )}
            
            {service.vendor && (
              <View style={styles.vendorCard}>
                <View style={styles.vendorAvatar}>
                  <Ionicons name="business" size={18} color="#FF6B35" />
                </View>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{service.vendor.name}</Text>
                  <View style={styles.vendorBadge}>
                    <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                    <Text style={styles.vendorStatus}>Verified Provider</Text>
                  </View>
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#FF6B35" />
              <Text style={styles.statValue}>Fast</Text>
              <Text style={styles.statLabel}>Service</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-done-outline" size={18} color="#FF6B35" />
              <Text style={styles.statValue}>Quality</Text>
              <Text style={styles.statLabel}>Assured</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={18} color="#FF6B35" />
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Happy Clients</Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tab,
                      isActive && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Ionicons 
                      name={tab.icon} 
                      size={16} 
                      color={isActive ? tab.activeColor : "#6B7280"} 
                    />
                    <Text style={[
                      styles.tabText,
                      isActive && styles.activeTabText,
                      isActive && { color: tab.activeColor }
                    ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContentContainer}>
            {renderTabContent()}
          </View>

          {/* Additional Info */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Need more information?</Text>
              <Text style={styles.infoText}>
                This service provides comprehensive solutions with professional standards. 
                All work is backed by quality assurance and customer satisfaction guarantee.
              </Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  placeholderView: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sliderContainer: {
    position: "relative",
    height: IMAGE_HEIGHT,
  },
  slide: {
    width,
    height: IMAGE_HEIGHT,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  placeholderSlide: {
    width,
    height: IMAGE_HEIGHT,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  placeholderContent: {
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  sliderIndicators: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  indicatorsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 3,
  },
  indicatorActive: {
    width: 20,
    backgroundColor: "#FFFFFF",
  },
  imageCounter: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  floatingPrice: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  priceStarts: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FF6B35",
    marginTop: 1,
  },
  content: {
    padding: 16,
    marginTop: -10,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
    lineHeight: 28,
    marginBottom: 6,
  },
  shortDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B35",
  },
  vendorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 3,
  },
  vendorBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorStatus: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "500",
    marginLeft: 3,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 2,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 6,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
  },
  // Tab Styles
  tabContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    marginBottom: 20,
    padding: 4,
  },
  tabScrollContent: {
    paddingHorizontal: 4,
       paddingVertical: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 2,
    minWidth: 100,
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  activeTabText: {
    fontWeight: "700",
  },
  tabContentContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 20,
  },
  tabContent: {
    padding: 0,
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 1,
  },
  tabSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  contentList: {
    padding: 16,
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
  tcText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: "#F0F7FF",
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    marginTop: 8,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
});