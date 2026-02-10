import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const C = {
  bg: '#F7FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  brand: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
};

/**
 * Get predefined date ranges
 */
const getDateRange = (filterType) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filterType) {
    case 'today':
      return { startDate: today, endDate: today };

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { startDate: yesterday, endDate: yesterday };
    }

    case 'thisWeek': {
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: monday, endDate: sunday };
    }

    case 'lastWeek': {
      const dayOfWeek = today.getDay();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      return { startDate: lastMonday, endDate: lastSunday };
    }

    case 'thisMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: firstDay, endDate: lastDay };
    }

    case 'lastMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: firstDay, endDate: lastDay };
    }

    default:
      return null;
  }
};

/**
 * Format date to YYYY-MM-DD for API
 */
const formatDateForAPI = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display
 */
const formatDateForDisplay = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const DateFilterModal = ({ visible, onClose, onApply, currentStartDate, currentEndDate, currentFilterType }) => {

  const [customStartInput, setCustomStartInput] = useState('');
  const [customEndInput, setCustomEndInput] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [error, setError] = useState(null);

  const quickFilters = [
    { label: 'Today', value: 'today', icon: 'calendar' },
    { label: 'Yesterday', value: 'yesterday', icon: 'calendar' },
    { label: 'This Week', value: 'thisWeek', icon: 'calendar' },
    { label: 'Last Week', value: 'lastWeek', icon: 'calendar' },
    { label: 'This Month', value: 'thisMonth', icon: 'calendar' },
    { label: 'Last Month', value: 'lastMonth', icon: 'calendar' },
  ];

  const handleQuickFilter = (filterType) => {
    const range = getDateRange(filterType);
    if (range) {
      const formattedStart = formatDateForAPI(range.startDate);
      const formattedEnd = formatDateForAPI(range.endDate);
      onApply(formattedStart, formattedEnd, filterType); // Pass filterType
      onClose();
    }
  };

  const handleCustomRange = () => {
    setShowCustomInputs(true);
  };

  const handleApplyCustomRange = () => {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!customStartInput || !customEndInput) {
      setError('Please enter both start and end dates');
      return;
    }

    if (!dateRegex.test(customStartInput) || !dateRegex.test(customEndInput)) {
      setError('Invalid date format. Use YYYY-MM-DD');
      return;
    }

    const start = new Date(customStartInput);
    const end = new Date(customEndInput);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid date');
      return;
    }

    if (start > end) {
      setError('Start date must be before end date');
      return;
    }

    setError(null);
    onApply(customStartInput, customEndInput, 'custom'); // Pass 'custom' as filterType
    onClose();
    setShowCustomInputs(false);
    setCustomStartInput('');
    setCustomEndInput('');
  };

  const handleClear = () => {
    onApply(null, null);
    onClose();
    setShowCustomInputs(false);
    setCustomStartInput('');
    setCustomEndInput('');
  };

  const handleBackFromCustom = () => {
    setShowCustomInputs(false);
    setError(null);
    setCustomStartInput('');
    setCustomEndInput('');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter by Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {!showCustomInputs ? (
              /* Quick Filters */
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Filters</Text>
                <View style={styles.quickFiltersGrid}>
                  {quickFilters.map((filter) => {
                    const isActive = currentFilterType === filter.value;
                    return (
                      <TouchableOpacity
                        key={filter.value}
                        style={[
                          styles.quickFilterButton,
                          isActive && styles.activeFilterButton,
                        ]}
                        onPress={() => handleQuickFilter(filter.value)}
                        activeOpacity={0.7}
                      >
                        <Icon name={filter.icon} size={18} color={isActive ? '#FFFFFF' : C.brand} />
                        <Text style={[styles.quickFilterText, isActive && styles.activeFilterText]}>
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Custom Range Button */}
                  <TouchableOpacity
                    style={[
                      styles.quickFilterButton,
                      currentFilterType === 'custom' ? styles.activeFilterButton : styles.customButton,
                    ]}
                    onPress={handleCustomRange}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="edit-3"
                      size={18}
                      color={currentFilterType === 'custom' ? '#FFFFFF' : C.brand}
                    />
                    <Text
                      style={[
                        styles.quickFilterText,
                        currentFilterType === 'custom' && styles.activeFilterText,
                      ]}
                    >
                      Custom Range
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Custom Date Input */
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={handleBackFromCustom}
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={20} color={C.brand} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Custom Date Range</Text>
                <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g., 2024-01-15)</Text>

                {/* Start Date Input */}
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customStartInput}
                    onChangeText={setCustomStartInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.muted}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                {/* End Date Input */}
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customEndInput}
                    onChangeText={setCustomEndInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={C.muted}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={16} color={C.red} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.applyCustomButton}
                  onPress={handleApplyCustomRange}
                  activeOpacity={0.7}
                >
                  <Text style={styles.applyCustomButtonText}>Apply Custom Range</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer Buttons */}
          {!showCustomInputs && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Filter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: 500,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 16,
  },
  quickFiltersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  customButton: {
    backgroundColor: '#EFF6FF',
    borderColor: C.brand,
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  activeFilterButton: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.brand,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    marginBottom: 8,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 15,
    color: C.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: C.red,
    flex: 1,
  },
  applyCustomButton: {
    paddingVertical: 14,
    backgroundColor: C.brand,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCustomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
});

export default DateFilterModal;
