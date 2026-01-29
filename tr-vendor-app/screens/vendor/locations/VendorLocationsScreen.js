// screens/vendor/locations/VendorLocationsScreen.js
// Location selection and management screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getVendorLocations,
  requestLocation,
} from '../../api/client';

const BRAND = {
  primary: '#1FC77A',
  primaryDark: '#12AD66',
  ink: '#0F1720',
  text: '#334155',
  subText: '#64748B',
  bg: '#F6F8FB',
  card: '#FFFFFF',
  border: '#E6EDF5',
  error: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  green: '#10B981',
};

export default function VendorLocationsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [approvedLocations, setApprovedLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLocations = useCallback(async () => {
    try {
      // Fetch vendor's locations - API returns allLocations (states with children cities)
      const vendorLocations = await getVendorLocations();
      setRequests(vendorLocations.requests || []);
      setApprovedLocations(vendorLocations.approvedLocations || []);

      // Flatten the hierarchical data: states -> cities with parent info
      // API returns: [{ id, name, children: [{ id, name }] }]
      // We need: [{ id, name, parent: { name } }]
      const statesWithCities = vendorLocations.allLocations || [];
      const flatCities = [];

      statesWithCities.forEach((state) => {
        // Backend returns 'cities' property (not 'children')
        const cities = state.cities || state.children || [];
        if (cities && Array.isArray(cities)) {
          cities.forEach((city) => {
            flatCities.push({
              id: city.id,
              name: city.name,
              slug: city.slug,
              parent: {
                id: state.id,
                name: state.name,
              },
            });
          });
        }
      });

      setAllLocations(flatCities);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      setAllLocations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocations();
  }, [fetchLocations]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'REJECTED':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const isLocationApproved = (locationId) => {
    return approvedLocations.some((al) => al.location?.id === locationId || al.locationId === locationId);
  };

  const hasLocationRequest = (locationId) => {
    return requests.some((r) => r.location?.id === locationId || r.locationId === locationId);
  };

  const getLocationRequest = (locationId) => {
    return requests.find((r) => r.location?.id === locationId || r.locationId === locationId);
  };

  const toggleLocationSelection = (location) => {
    setSelectedLocations((prev) => {
      const isSelected = prev.some((l) => l.id === location.id);
      if (isSelected) {
        return prev.filter((l) => l.id !== location.id);
      } else {
        return [...prev, location];
      }
    });
  };

  // Select all cities in a state
  const toggleStateSelection = (stateName, citiesInState) => {
    const availableCities = citiesInState.filter(city => {
      const isApproved = isLocationApproved(city.id);
      const hasRequest = hasLocationRequest(city.id);
      return !isApproved && !hasRequest;
    });

    const allSelected = availableCities.every(city =>
      selectedLocations.some(l => l.id === city.id)
    );

    if (allSelected) {
      // Deselect all cities in this state
      setSelectedLocations(prev =>
        prev.filter(loc => !availableCities.some(city => city.id === loc.id))
      );
    } else {
      // Select all cities in this state
      setSelectedLocations(prev => {
        const newSelections = [...prev];
        availableCities.forEach(city => {
          if (!newSelections.some(l => l.id === city.id)) {
            newSelections.push(city);
          }
        });
        return newSelections;
      });
    }
  };

  // Select all available locations
  const selectAllLocations = () => {
    const availableLocations = allLocations.filter(location => {
      const isApproved = isLocationApproved(location.id);
      const hasRequest = hasLocationRequest(location.id);
      return !isApproved && !hasRequest;
    });

    if (selectedLocations.length === availableLocations.length) {
      // Deselect all
      setSelectedLocations([]);
    } else {
      // Select all
      setSelectedLocations(availableLocations);
    }
  };

  const handleRequestLocations = async () => {
    if (selectedLocations.length === 0) {
      Alert.alert('Error', 'Please select at least one location');
      return;
    }

    setSubmitting(true);
    try {
      // Request each location
      for (const location of selectedLocations) {
        await requestLocation(location.id, requestMessage);
      }

      setShowRequestModal(false);
      setSelectedLocations([]);
      setRequestMessage('');
      fetchLocations();
      Alert.alert('Success', 'Location request(s) submitted successfully!');
    } catch (error) {
      console.error('Request location failed:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'VendorDashboard' }],
    });
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED');

  // Filter locations based on search
  const filteredLocations = allLocations.filter((location) => {
    const query = searchQuery.toLowerCase();
    const name = location.name?.toLowerCase() || '';
    const parent = location.parent?.name?.toLowerCase() || '';
    return name.includes(query) || parent.includes(query);
  });

  // Group locations by parent (state)
  const groupedLocations = filteredLocations.reduce((acc, location) => {
    const parentName = location.parent?.name || 'Other';
    if (!acc[parentName]) {
      acc[parentName] = [];
    }
    acc[parentName].push(location);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Locations</Text>
            <Text style={styles.headerSubtitle}>
              {approvedLocations.length === 0 && requests.length === 0
                ? 'Step 3: Select cities where you want to operate'
                : 'Manage your operational locations'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowRequestModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Request</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#D1FAE5' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-circle" size={24} color={BRAND.green} />
            </View>
            <View>
              <Text style={[styles.statNumber, { color: BRAND.green }]}>{approvedLocations.length}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEF3C7' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={24} color={BRAND.yellow} />
            </View>
            <View>
              <Text style={[styles.statNumber, { color: BRAND.yellow }]}>{pendingRequests.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          <View style={[styles.statCard, { borderColor: '#FEE2E2' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={24} color={BRAND.error} />
            </View>
            <View>
              <Text style={[styles.statNumber, { color: BRAND.error }]}>{rejectedRequests.length}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Approved Locations */}
        <View style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-circle" size={20} color={BRAND.green} />
            <Text style={[styles.sectionTitle, { color: BRAND.green }]}>
              Approved Locations ({approvedLocations.length})
            </Text>
          </View>

          {approvedLocations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No approved locations yet</Text>
              <Text style={styles.emptyText}>Request locations to start operating</Text>
            </View>
          ) : (
            <View style={styles.locationsWrap}>
              {approvedLocations.map((item) => (
                <View key={item.id} style={styles.locationChip}>
                  <Ionicons name="location" size={16} color={BRAND.green} />
                  <Text style={styles.locationChipText}>{item.location?.name}</Text>
                  {item.location?.parent && (
                    <Text style={styles.locationChipParent}>({item.location.parent.name})</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time" size={20} color={BRAND.yellow} />
              <Text style={[styles.sectionTitle, { color: '#B45309' }]}>
                Pending Requests ({pendingRequests.length})
              </Text>
            </View>

            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestLeft}>
                  <Ionicons name="location" size={20} color={BRAND.yellow} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.location?.name}
                      {request.location?.parent && (
                        <Text style={styles.requestParent}> ({request.location.parent.name})</Text>
                      )}
                    </Text>
                    <Text style={styles.requestDate}>
                      Requested {formatDate(request.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.statusText, { color: '#B45309' }]}>Pending Review</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle" size={20} color={BRAND.error} />
              <Text style={[styles.sectionTitle, { color: BRAND.error }]}>
                Rejected Requests ({rejectedRequests.length})
              </Text>
            </View>

            {rejectedRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestLeft}>
                  <Ionicons name="location" size={20} color={BRAND.error} />
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.location?.name}
                      {request.location?.parent && (
                        <Text style={styles.requestParent}> ({request.location.parent.name})</Text>
                      )}
                    </Text>
                    {request.rejectionReason && (
                      <Text style={styles.rejectionReason}>
                        Reason: {request.rejectionReason}
                      </Text>
                    )}
                    <Text style={styles.requestDate}>
                      Rejected on {request.reviewedAt ? formatDate(request.reviewedAt) : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Continue Button */}
        {approvedLocations.length > 0 || requests.length > 0 ? (
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>Continue to Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.skipBtn} onPress={handleContinue}>
            <Text style={styles.skipBtnText}>Skip for now (You can add locations later)</Text>
            <Ionicons name="arrow-forward" size={18} color={BRAND.subText} />
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={BRAND.blue} />
          <Text style={styles.infoText}>
            Request locations where you want to operate. You'll receive booking inquiries from customers in these locations.
          </Text>
        </View>
      </ScrollView>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Locations</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowRequestModal(false)}
              >
                <Ionicons name="close" size={24} color={BRAND.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={20} color={BRAND.subText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search cities..."
                placeholderTextColor="#A3B3C2"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={BRAND.subText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Select All Button */}
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={selectAllLocations}
            >
              <Ionicons
                name={selectedLocations.length === allLocations.filter(l => !isLocationApproved(l.id) && !hasLocationRequest(l.id)).length && selectedLocations.length > 0
                  ? "checkbox"
                  : "square-outline"}
                size={22}
                color={BRAND.blue}
              />
              <Text style={styles.selectAllText}>
                {selectedLocations.length === allLocations.filter(l => !isLocationApproved(l.id) && !hasLocationRequest(l.id)).length && selectedLocations.length > 0
                  ? 'Deselect All Locations'
                  : 'Select All Locations'}
              </Text>
            </TouchableOpacity>

            {/* Selected Count */}
            {selectedLocations.length > 0 && (
              <View style={styles.selectedCount}>
                <Text style={styles.selectedCountText}>
                  {selectedLocations.length} location(s) selected
                </Text>
                <TouchableOpacity onPress={() => setSelectedLocations([])}>
                  <Text style={styles.clearSelectionText}>Clear all</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Location List */}
            <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
              {Object.keys(groupedLocations).length === 0 ? (
                <View style={styles.emptySearchState}>
                  <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptySearchText}>No locations found</Text>
                </View>
              ) : (
                Object.entries(groupedLocations).map(([state, locations]) => {
                  const availableCitiesInState = locations.filter(l => !isLocationApproved(l.id) && !hasLocationRequest(l.id));
                  const allStateSelected = availableCitiesInState.length > 0 && availableCitiesInState.every(city =>
                    selectedLocations.some(l => l.id === city.id)
                  );

                  return (
                    <View key={state} style={styles.stateGroup}>
                      {/* Clickable State Title */}
                      <TouchableOpacity
                        style={styles.stateTitleRow}
                        onPress={() => toggleStateSelection(state, locations)}
                        disabled={availableCitiesInState.length === 0}
                      >
                        <View style={styles.stateTitleLeft}>
                          <Ionicons
                            name={allStateSelected ? "checkbox" : "square-outline"}
                            size={20}
                            color={availableCitiesInState.length === 0 ? '#CBD5E1' : BRAND.primary}
                          />
                          <Text style={[styles.stateTitle, availableCitiesInState.length === 0 && styles.stateTitleDisabled]}>
                            {state}
                          </Text>
                        </View>
                        {availableCitiesInState.length > 0 && (
                          <Text style={styles.stateCitiesCount}>
                            {availableCitiesInState.length} cities
                          </Text>
                        )}
                      </TouchableOpacity>
                      <View style={styles.citiesWrap}>
                      {locations.map((location) => {
                        const isApproved = isLocationApproved(location.id);
                        const hasRequest = hasLocationRequest(location.id);
                        const isSelected = selectedLocations.some((l) => l.id === location.id);
                        const disabled = isApproved || hasRequest;

                        return (
                          <TouchableOpacity
                            key={location.id}
                            style={[
                              styles.cityChip,
                              isApproved && styles.cityChipApproved,
                              hasRequest && !isApproved && styles.cityChipPending,
                              isSelected && styles.cityChipSelected,
                            ]}
                            onPress={() => !disabled && toggleLocationSelection(location)}
                            disabled={disabled}
                          >
                            {isSelected ? (
                              <Ionicons name="checkmark-circle" size={16} color={BRAND.blue} />
                            ) : isApproved ? (
                              <Ionicons name="checkmark-circle" size={16} color={BRAND.green} />
                            ) : hasRequest ? (
                              <Ionicons name="time" size={16} color={BRAND.yellow} />
                            ) : (
                              <Ionicons name="add-circle-outline" size={16} color={BRAND.subText} />
                            )}
                            <Text style={[
                              styles.cityChipText,
                              isApproved && styles.cityChipTextApproved,
                              isSelected && styles.cityChipTextSelected,
                            ]}>
                              {location.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Message (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Any specific requirements..."
                placeholderTextColor="#A3B3C2"
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowRequestModal(false);
                  setSelectedLocations([]);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (submitting || selectedLocations.length === 0) && styles.submitBtnDisabled,
                ]}
                onPress={handleRequestLocations}
                disabled={submitting || selectedLocations.length === 0}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: BRAND.subText,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BRAND.ink,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: BRAND.blue,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: BRAND.card,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: BRAND.subText,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },

  // Section Card
  sectionCard: {
    backgroundColor: BRAND.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.ink,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 4,
  },

  // Locations Wrap
  locationsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    gap: 4,
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  locationChipParent: {
    fontSize: 12,
    color: '#10B981',
  },

  // Request Item
  requestItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.ink,
  },
  requestParent: {
    fontWeight: '400',
    color: BRAND.subText,
  },
  requestDate: {
    fontSize: 12,
    color: BRAND.subText,
    marginTop: 4,
  },
  rejectionReason: {
    fontSize: 13,
    color: BRAND.error,
    marginTop: 4,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Continue Button
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Skip Button
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    backgroundColor: BRAND.card,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.subText,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: BRAND.text,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BRAND.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.ink,
  },
  modalClose: {
    padding: 4,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND.ink,
  },

  // Select All Button
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 10,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.blue,
  },

  selectedCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.blue,
  },
  clearSelectionText: {
    fontSize: 13,
    color: BRAND.error,
    fontWeight: '600',
  },
  locationsList: {
    maxHeight: 300,
    marginBottom: 12,
  },
  stateGroup: {
    marginBottom: 16,
  },

  // State Title Row (clickable)
  stateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  stateTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stateTitleDisabled: {
    color: '#CBD5E1',
  },
  stateCitiesCount: {
    fontSize: 11,
    color: BRAND.subText,
    fontWeight: '600',
  },
  citiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.border,
    gap: 4,
  },
  cityChipApproved: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  cityChipPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  cityChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: BRAND.blue,
  },
  cityChipText: {
    fontSize: 13,
    color: BRAND.text,
  },
  cityChipTextApproved: {
    color: '#059669',
  },
  cityChipTextSelected: {
    color: BRAND.blue,
    fontWeight: '600',
  },
  emptySearchState: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: BRAND.subText,
    marginTop: 12,
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND.ink,
    backgroundColor: '#FBFDFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.text,
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BRAND.blue,
    gap: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
