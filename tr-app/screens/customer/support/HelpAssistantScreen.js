import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, Keyboard, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from '../../../components/SafeModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { assistantService, storiesService } from '../../services';
import { StoryCard } from '../../../components/StoriesRail';
import { TEAL_DEEP, TEAL_MID, TEAL, TEAL_LIGHT, TEXT_PRIMARY, TEXT_MUTED } from '../../../theme';
import { ASSISTANT_LANGUAGES, languageByKey } from './assistantLanguages';

const LANGUAGE_KEY = 'assistant_language';

// Where each `app:` link from the assistant goes. Tabs live inside the
// CustomerDashboard tab navigator; everything else is a stack screen.
const TAB_SCREENS = ['Payments', 'Chat', 'Bookings', 'Home'];

// The customer's own bookings, linked as booking:<type>:<id> or
// quote:<type>:<id> (types as the bookings API names them).
const BOOKING_SCREENS = {
  bike: 'BikeBookingDetail', car: 'SelfDriveBookingDetail', bus: 'BusBookingDetail',
  truck: 'TruckBookingDetail', packers: 'PackersBookingDetail', equipment: 'EquipmentBookingDetail',
  luxury: 'LuxuryBookingDetail', bulk: 'BulkBookingDetail',
};
const QUOTE_SCREENS = {
  bike: 'BikeQuoteRequestDetail', car: 'SelfDriveQuoteRequestDetail', bus: 'BusQuoteRequestDetail',
  truck: 'TruckQuoteRequestDetail', packers: 'PackersQuoteRequestDetail',
  equipment: 'EquipmentQuoteRequestDetail', luxury: 'LuxuryQuoteDetail',
};

const openBookingLink = (navigation, target) => {
  const [kind, type, ...rest] = target.split(':');
  const id = rest.join(':');
  if (kind === 'quote' && QUOTE_SCREENS[type]) {
    navigation.navigate(QUOTE_SCREENS[type], { requestId: id });
  } else if (type === 'chauffeur') {
    navigation.navigate('BookingDetail', { bookingId: id, bookingType: 'car' });
  } else if (BOOKING_SCREENS[type]) {
    navigation.navigate(BOOKING_SCREENS[type], { bookingId: id });
  } else {
    navigation.navigate('MyBookings');
  }
};

const openAppLink = (navigation, target) => {
  if (target.startsWith('booking:') || target.startsWith('quote:')) {
    openBookingLink(navigation, target);
    return;
  }
  if (target.startsWith('story:')) {
    navigation.navigate('WebStoryViewer', { slug: target.slice(6) });
    return;
  }
  if (target.startsWith('tour:')) {
    navigation.navigate('WanderListingDetail', { listingId: target.slice(5) });
    return;
  }
  const screen = target.replace(/^app:/, '');
  if (TAB_SCREENS.includes(screen)) {
    navigation.navigate('CustomerDashboard', { screen });
  } else {
    navigation.navigate(screen);
  }
};

// Split one line of the reply into plain, bold and link pieces.
const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

const renderInline = (line, keyPrefix, navigation) =>
  line.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={key} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, target] = link;
      if (!/^(app|story|tour|booking|quote):/.test(target)) return <Text key={key} style={styles.bold}>{label}</Text>;
      const icon = target.startsWith('story:') ? '▶ ' : '';
      return (
        <Text key={key} style={styles.link} onPress={() => openAppLink(navigation, target)} suppressHighlighting>
          {icon}{label} ↗
        </Text>
      );
    }
    return <Text key={key}>{part}</Text>;
  });

// Render the assistant's markdown: paragraphs, bullet and numbered lists,
// bold text and tappable screen links.
const AssistantText = ({ content, navigation }) => {
  const lines = content.split('\n');
  return (
    <View>
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <View key={i} style={styles.gap} />;
        const bullet = line.match(/^[-*•]\s+(.*)$/);
        const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
        const heading = line.match(/^#{1,6}\s+(.*)$/);
        if (bullet || numbered) {
          return (
            <View key={i} style={styles.listRow}>
              <Text style={styles.botText}>{bullet ? '•' : `${numbered[1]}.`}</Text>
              <Text style={[styles.botText, styles.listText]}>
                {renderInline(bullet ? bullet[1] : numbered[2], i, navigation)}
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={[styles.botText, heading && styles.bold]}>
            {renderInline(heading ? heading[1] : line, i, navigation)}
          </Text>
        );
      })}
    </View>
  );
};

export default function HelpAssistantScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [storiesBySlug, setStoriesBySlug] = useState({});
  const [language, setLanguage] = useState('auto');
  const [showLanguages, setShowLanguages] = useState(false);
  const [keyboardPad, setKeyboardPad] = useState(0);
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();
  const current = languageByKey(language);

  // Android: on Android 15+ the app draws edge-to-edge, so the window no
  // longer shrinks for the keyboard and the input bar ends up under it.
  // There the window is as tall as the screen; pad the chat by the part of
  // the keyboard that sits above the bottom safe-area inset (which the
  // SafeAreaView already leaves free). When the window does shrink for the
  // keyboard (older Android), no pad is needed.
  const bottomInsetRef = useRef(0);
  bottomInsetRef.current = insets.bottom;
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      const screenHeight = Dimensions.get('screen').height;
      const edgeToEdge = Dimensions.get('window').height >= screenHeight - 1;
      if (!edgeToEdge) return;
      const covered = screenHeight - e.endCoordinates.screenY - bottomInsetRef.current;
      setKeyboardPad(Math.max(0, Math.round(covered)));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardPad(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Remember the reply language between chats.
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((saved) => { if (saved) setLanguage(languageByKey(saved).key); })
      .catch(() => {});
  }, []);

  const chooseLanguage = (key) => {
    setLanguage(key);
    setShowLanguages(false);
    AsyncStorage.setItem(LANGUAGE_KEY, key).catch(() => {});
  };

  // Covers for stories the assistant recommends, shown as cards under a reply.
  useEffect(() => {
    storiesService.getStories()
      .then((list) => setStoriesBySlug(Object.fromEntries(list.map((st) => [st.slug, st]))))
      .catch(() => {});
  }, []);

  const storiesIn = (content) => {
    const slugs = [...new Set([...content.matchAll(/\(story:([^)\s]+)\)/g)].map((m) => m[1]))];
    return slugs.map((slug) => storiesBySlug[slug]).filter(Boolean);
  };

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, loading]);

  // The input is uncontrolled: on the new architecture a controlled
  // TextInput on Android can drop the keyboard's last update (typing "Hi"
  // left "H" in state). The typed text is kept in a ref instead, and the
  // field is cleared through its own ref after sending.
  const inputRef = useRef('');
  const textInputRef = useRef(null);
  const changeInput = (text) => {
    inputRef.current = text;
    setInput(text);
  };

  const send = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;
    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    changeInput('');
    textInputRef.current?.clear();
    setLoading(true);

    // Work out the reply first and add it in one update, whatever happened.
    let reply;
    try {
      const data = await assistantService.sendMessage(nextMessages, language);
      reply = data?.reply || data?.error || 'Something went wrong. Please try again.';
    } catch (error) {
      reply = error?.response?.data?.error
        || (error?.response ? 'Something went wrong. Please try again.' : 'Connection error. Please check your internet and try again.');
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={TEAL_DEEP} />
      <LinearGradient colors={[TEAL_DEEP, TEAL_MID]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Ionicons name="sparkles" size={18} color={TEAL} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>TransRentals Assistant</Text>
          <Text style={styles.headerSub}>Booking, payment & trip help</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowLanguages(true)}
          style={styles.langBtn}
          accessibilityLabel={`Reply language: ${current.english}`}
        >
          <Ionicons name="language" size={17} color="#fff" />
          <Text style={styles.langBtnText}>{current.short}</Text>
        </TouchableOpacity>
        {messages.length > 0 && (
          <TouchableOpacity onPress={() => setMessages([])} style={styles.headerBtn} accessibilityLabel="Start a new chat">
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={{ flex: 1, paddingBottom: keyboardPad }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.rowLeft}>
            <View style={styles.botAvatar}><Ionicons name="sparkles" size={12} color={TEAL} /></View>
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.botText}>{current.greeting}</Text>
            </View>
          </View>

          {messages.length === 0 && (
            <View style={styles.suggestions}>
              {current.suggestions.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)} activeOpacity={0.7}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((m, i) => (
            m.role === 'user' ? (
              <View key={i} style={styles.rowRight}>
                <View style={[styles.bubble, styles.userBubble]}>
                  <Text style={styles.userText}>{m.content}</Text>
                </View>
              </View>
            ) : (
              <View key={i}>
                <View style={styles.rowLeft}>
                  <View style={styles.botAvatar}><Ionicons name="sparkles" size={12} color={TEAL} /></View>
                  <View style={[styles.bubble, styles.botBubble]}>
                    <AssistantText content={m.content} navigation={navigation} />
                  </View>
                </View>
                {storiesIn(m.content).length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
                    {storiesIn(m.content).map((story) => (
                      <StoryCard
                        key={story.slug}
                        story={story}
                        width={112}
                        onPress={() => navigation.navigate('WebStoryViewer', { slug: story.slug, title: story.title })}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            )
          ))}

          {loading && (
            <View style={styles.rowLeft}>
              <View style={styles.botAvatar}><Ionicons name="sparkles" size={12} color={TEAL} /></View>
              <View style={[styles.bubble, styles.botBubble, styles.typing]}>
                <ActivityIndicator size="small" color={TEAL} />
                <Text style={styles.typingText}>Typing…</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            ref={textInputRef}
            style={styles.input}
            onChangeText={changeInput}
            placeholder="Type your question..."
            placeholderTextColor="#94A3B8"
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={(e) => send(e.nativeEvent.text || inputRef.current)}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={() => send(inputRef.current)}
            disabled={!input.trim() || loading}
            accessibilityLabel="Send"
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </View>
      {/* Reply language picker */}
      <Modal visible={showLanguages} transparent animationType="fade" onRequestClose={() => setShowLanguages(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setShowLanguages(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Reply language</Text>
            <Text style={styles.sheetSub}>The assistant will answer in the language you pick.</Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {ASSISTANT_LANGUAGES.map((lang) => {
                const active = lang.key === language;
                return (
                  <TouchableOpacity
                    key={lang.key}
                    style={[styles.langRow, active && styles.langRowActive]}
                    onPress={() => chooseLanguage(lang.key)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langNative, active && { color: TEAL_MID }]}>{lang.native}</Text>
                      <Text style={styles.langEnglish}>{lang.english}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={22} color={TEAL} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TEAL_DEEP },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  list: { padding: 14, paddingBottom: 20, gap: 10, backgroundColor: '#F0F4F8', flexGrow: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start' },
  rowRight: { flexDirection: 'row', justifyContent: 'flex-end' },
  botAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: TEAL_LIGHT, justifyContent: 'center', alignItems: 'center', marginRight: 6, marginTop: 2 },
  bubble: { maxWidth: '84%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  botBubble: { backgroundColor: '#fff', borderTopLeftRadius: 4, elevation: 1 },
  userBubble: { backgroundColor: TEAL_MID, borderTopRightRadius: 4 },
  botText: { fontSize: 14, lineHeight: 21, color: TEXT_PRIMARY },
  userText: { fontSize: 14, lineHeight: 20, color: '#fff' },
  bold: { fontWeight: '700' },
  link: { color: TEAL_MID, fontWeight: '700', textDecorationLine: 'underline' },
  gap: { height: 6 },
  listRow: { flexDirection: 'row', gap: 6, marginVertical: 1 },
  listText: { flex: 1 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 30 },
  storyRow: { gap: 8, paddingLeft: 30, paddingTop: 8, paddingRight: 8 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  langBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 12 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY },
  sheetSub: { fontSize: 12.5, color: '#64748B', marginTop: 2, marginBottom: 10 },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14, marginBottom: 4 },
  langRowActive: { backgroundColor: '#ECFDF5' },
  langNative: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  langEnglish: { fontSize: 12, color: '#64748B', marginTop: 1 },
  chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: TEAL_LIGHT, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 12.5, color: TEAL_MID, fontWeight: '600' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: TEXT_MUTED },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2EAF4' },
  // Single line: a multiline input on the new architecture can measure the
  // text a little narrow and wrap the last letter onto a hidden line.
  input: { flex: 1, height: 44, backgroundColor: '#F8FAFC', borderRadius: 22, borderWidth: 1, borderColor: '#E2EAF4', paddingHorizontal: 16, paddingVertical: 0, fontSize: 15, color: TEXT_PRIMARY },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: TEAL_MID, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: '#CBD5E1' },
});
