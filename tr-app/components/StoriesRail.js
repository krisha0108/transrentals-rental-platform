import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import storiesService, { storyImageUri } from '../screens/services/storiesService';

const GREEN = '#09B368';

// One tall story card (9:16 like the story itself) with the cover image,
// a dark fade at the bottom for the title, and the number of slides.
export const StoryCard = ({ story, width = 132, onPress }) => {
  const uri = storyImageUri(story.coverImage || story.coverImageSquare);
  const height = Math.round(width * 16 / 9);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { width, height }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#0F766E', '#09B368']} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardTop}>
        {story.isFeatured ? (
          <View style={styles.popularBadge}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        ) : <View />}
        <View style={styles.playBadge}>
          <Ionicons name="play" size={10} color="#fff" />
          {story.slideCount ? <Text style={styles.playText}>{story.slideCount}</Text> : null}
        </View>
      </View>
      <View style={styles.cardBottom}>
        {story.category ? <Text style={styles.cardCategory} numberOfLines={1}>{story.category}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={3}>{story.title}</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Horizontal row of web stories with a header and "View all".
 * Renders nothing when there are no stories, so screens can drop it in
 * without a check.
 *
 * @param {string} title - section heading
 * @param {string} [subtitle]
 * @param {string} [city] - only stories about this city
 * @param {number} [limit] - how many cards to show
 * @param {boolean} [popularFirst] - put stories admin marked Popular first
 */
export default function StoriesRail({ title = 'Travel Stories', subtitle, city, limit = 10, popularFirst = false, style }) {
  const navigation = useNavigation();
  const [stories, setStories] = useState(null);

  useEffect(() => {
    let alive = true;
    (popularFirst && !city ? storiesService.getPopularFirst() : storiesService.getStories({ city }))
      .then((list) => { if (alive) setStories(list); })
      .catch(() => { if (alive) setStories([]); });
    return () => { alive = false; };
  }, [city, popularFirst]);

  if (stories === null) {
    return (
      <View style={[styles.section, styles.loading, style]}>
        <ActivityIndicator color={GREEN} />
      </View>
    );
  }
  if (stories.length === 0) return null;

  const openStory = (story) => navigation.navigate('WebStoryViewer', { slug: story.slug, title: story.title });

  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {stories.length > 2 && (
          <TouchableOpacity
            style={styles.viewAll}
            onPress={() => navigation.navigate('WebStories', city ? { city, title } : undefined)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={14} color={GREEN} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {stories.slice(0, limit).map((story) => (
          <StoryCard key={story.id} story={story} onPress={() => openStory(story)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 18 },
  loading: { height: 80, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#E8F8F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  viewAllText: { fontSize: 12, fontWeight: '700', color: GREEN },
  row: { paddingHorizontal: 16, gap: 10 },
  card: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0F766E' },
  cardTop: { position: 'absolute', top: 8, left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  playBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  playText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBottom: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  cardCategory: { color: '#A7F3D0', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  cardTitle: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 17 },
});
