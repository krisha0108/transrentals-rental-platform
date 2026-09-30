import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Linking, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL } from '../../api';
import { storyPageUrl } from '../../services/storiesService';

// The web player sizes its 9:16 card as 92vh tall, which on a tall phone is
// wider than the screen and crops both sides. This caps the height at what
// the width allows (the same fix is in the web StoryViewer; this covers
// servers that don't have it yet).
const FIT_STORY_CSS = `
  (function () {
    var css = 'div[style*="aspect-ratio"][style*="92vh"]{height:min(92vh,calc(100vw * 16 / 9)) !important;max-width:100vw !important;}';
    var tag = document.createElement('style');
    tag.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(tag);
  })();
  true;
`;

// "transrentals.in" (or "localhost:3000" in dev), with or without "www."
const SITE_HOST = BASE_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

// Plays one web story full screen. The story page on the website is loaded
// in a WebView, so designer-built slides, videos, progress bars, tap and
// long-press all behave exactly as on the web.
export default function WebStoryViewerScreen() {
  const navigation = useNavigation();
  const { slug } = useRoute().params || {};
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const closedRef = useRef(false);
  const storyPath = `/stories/${slug}`;

  const close = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    navigation.goBack();
  };

  // The web player's own close button and swipe-down go to /stories; in the
  // app that means "close". Any other link (a slide's call to action) opens
  // in the phone's browser.
  const handleNavigation = (url) => {
    if (!url || url === 'about:blank') return true;
    const [, host, rest = ''] = url.match(/^https?:\/\/([^/?#]+)(.*)$/) || [];
    const sameSite = !!host && host.replace(/^www\./, '') === SITE_HOST;
    const path = sameSite ? (rest.split(/[?#]/)[0] || '/') : null;
    if (path && path.startsWith(storyPath)) return true;
    if (sameSite && (path === '/stories' || path === '/stories/' || path === '/')) {
      close();
      return false;
    }
    Linking.openURL(url).catch(() => {});
    return false;
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {!failed && (
        <WebView
          source={{ uri: storyPageUrl(slug) }}
          style={styles.web}
          injectedJavaScript={FIT_STORY_CSS}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setFailed(true); setLoading(false); }}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) { setFailed(true); setLoading(false); } }}
          onShouldStartLoadWithRequest={(req) => handleNavigation(req.url)}
          onNavigationStateChange={(state) => { handleNavigation(state.url); }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          overScrollMode="never"
        />
      )}

      {loading && (
        <View style={styles.center} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {failed && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color="#9CA3AF" />
          <Text style={styles.failText}>Couldn't load this story</Text>
          <TouchableOpacity
            style={styles.retry}
            onPress={() => { setFailed(false); setLoading(true); }}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Always-available close, in case the page's own button is hidden. */}
      <SafeAreaView edges={['top']} style={styles.closeWrap} pointerEvents="box-none">
        {(loading || failed) && (
          <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel="Close story">
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
  center: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 12 },
  failText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600' },
  retry: { backgroundColor: '#09B368', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#fff', fontWeight: '700' },
  closeWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  closeBtn: { margin: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});
