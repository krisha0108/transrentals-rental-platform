import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { api } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  dim: 'rgba(15,23,42,0.65)',
  line: 'rgba(2,6,23,0.08)',
  cyan: '#0891B2',
  red: '#DC2626',
};

const buildImageUri = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = api?.defaults?.baseURL || '';
  const origin = base.replace(/\/api.*$/, '');
  const clean = path.replace(/^\/+/, '');
  const inStorage = clean.startsWith('storage/') ? clean : `storage/${clean}`;
  return `${origin}/${inStorage}`;
};

const getVendor = (post = {}) => {
  const v = post.vendor ?? post.author ?? {};
  return {
    id: v.id ?? null,
    name: v.name ?? 'Unknown',
    profile_image: v.profile_image ? buildImageUri(v.profile_image) : null,
  };
};

const getCatName = (c) => (typeof c === 'string' ? c : (c?.name ?? 'General'));

export default function SearchOverlay({ visible, onClose, onSelectPost }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notes'); // notes | users

  useEffect(() => {
    if (visible) {
      // Reset when opened
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, activeTab]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const vendorId = await AsyncStorage.getItem('vendor_id');
      
      if (activeTab === 'notes') {
        const { data } = await api.get('/vendor/social/search/notes', {
          params: {
            q: searchQuery,
            vendor_id: vendorId ? Number(vendorId) : undefined,
            limit: 20,
          },
        });
        setSearchResults(data?.data || []);
      } else {
        // Search users
        const { data } = await api.get('/vendor/social/search/users', {
          params: {
            q: searchQuery,
            limit: 20,
          },
        });
        setSearchResults(data?.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderNoteItem = ({ item }) => {
    const vendor = getVendor(item);
    const category = getCatName(item.category);
    const isSOS = category.toUpperCase() === 'SOS';

    return (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => {
          onSelectPost?.(item);
          onClose();
        }}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <Avatar uri={vendor.profile_image} size={32} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.vendorName}>{vendor.name}</Text>
            <View style={[styles.categoryPill, isSOS && styles.categoryPillSOS]}>
              <Ionicons
                name={isSOS ? 'alert-circle' : 'pricetags-outline'}
                size={10}
                color={isSOS ? '#fff' : C.cyan}
              />
              <Text style={[styles.categoryText, isSOS && { color: '#fff' }]}>
                {category}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.caption} numberOfLines={3}>
          {item.caption}
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="heart" size={14} color={C.red} />
            <Text style={styles.statText}>{item.likes || 0}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble-ellipses" size={14} color={C.text} />
            <Text style={styles.statText}>{item.comments || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        // You can add navigation to user profile here
        onClose();
      }}
      activeOpacity={0.8}
    >
      <Avatar uri={buildImageUri(item.profile_image)} size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.bio && (
          <Text style={styles.userBio} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>
      <View style={styles.followersCount}>
        <Ionicons name="people-outline" size={14} color={C.dim} />
        <Text style={styles.followersText}>
          {item.followers_count || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={C.cyan} />
        </View>
      );
    }

    if (searchQuery.trim().length < 2) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={C.dim} />
          <Text style={styles.emptyText}>
            Search for {activeTab === 'notes' ? 'posts' : 'users'}
          </Text>
          <Text style={styles.emptySubtext}>
            Type at least 2 characters to start searching
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={C.dim} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try different keywords
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color={C.dim} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={C.dim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={C.dim} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.tabActive]}
            onPress={() => setActiveTab('users')}
          >
            <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
              Users
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => String(item.id)}
            renderItem={activeTab === 'notes' ? renderNoteItem : renderUserItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </Modal>
  );
}

function Avatar({ uri, size = 40 }) {
  const [broken, setBroken] = useState(false);

  if (!uri || broken) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="person-outline"
          size={Math.floor(size * 0.45)}
          color="rgba(15,23,42,0.55)"
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setBroken(true)}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: C.text,
    padding: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
  },
  tab: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  tabActive: {
    backgroundColor: '#1c2f49ff',
    borderColor: 'rgba(34,211,238,0.35)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dim,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  resultCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(2,6,23,0.12)',
    backgroundColor: 'rgba(8,145,178,0.06)',
  },
  categoryPillSOS: {
    borderColor: 'rgba(236, 28, 28, 0.96)',
    backgroundColor: 'rgba(247, 76, 76, 0.68)',
  },
  categoryText: {
    color: C.cyan,
    fontSize: 9,
    fontWeight: '800',
  },
  caption: {
    color: C.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(2,6,23,0.06)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  userBio: {
    fontSize: 13,
    color: C.dim,
    marginTop: 2,
  },
  followersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.bg,
    borderRadius: 8,
  },
  followersText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.dim,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: C.dim,
    marginTop: 8,
    textAlign: 'center',
  },
});