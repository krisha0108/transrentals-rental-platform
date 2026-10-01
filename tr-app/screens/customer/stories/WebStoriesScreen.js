import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl,
  ActivityIndicator, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { storiesService } from '../../services';
import { StoryCard } from '../../../components/StoriesRail';

const GREEN = '#09B368';
const GAP = 12;
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - 16 * 2 - GAP) / 2);

// All web stories as a two-column grid, with search and category chips.
// Opened with `{ city }` it shows only the stories about that place.
export default function WebStoriesScreen() {
  const navigation = useNavigation();
  const { city, title } = useRoute().params || {};
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const load = useCallback(async () => {
    try {
      setError(false);
      setStories(await storiesService.getStories({ city }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [city]);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => {
    const names = [...new Set(stories.map((s) => (s.category || '').trim()).filter(Boolean))];
    return names.length > 1 ? ['All', ...names] : [];
  }, [stories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) =>
      (category === 'All' || (s.category || '').trim() === category) &&
      (!q || `${s.title} ${s.category || ''}`.toLowerCase().includes(q)));
  }, [stories, query, category]);

  const heading = city ? (title || `Stories from ${city}`) : 'Travel Stories';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />
      <LinearGradient colors={['#064E3B', '#078A52']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{heading}</Text>
            <Text style={styles.headerSub}>Guides, places to visit and trip ideas</Text>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search a place or topic"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {categories.length > 0 && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, category === c && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[GREEN]} />}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              width={CARD_WIDTH}
              onPress={() => navigation.navigate('WebStoryViewer', { slug: item.slug, title: item.title })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name={error ? 'cloud-offline-outline' : 'images-outline'} size={46} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>{error ? "Couldn't load stories" : 'No stories yet'}</Text>
              <Text style={styles.emptySub}>
                {error ? 'Pull down to try again.' : query ? 'Try another search.' : 'New travel stories are added regularly.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 19, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { fontSize: 12.5, fontWeight: '600', color: '#374151' },
  chipTextActive: { color: '#fff' },
  grid: { padding: 16, paddingTop: 4, gap: GAP, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6B7280' },
});
