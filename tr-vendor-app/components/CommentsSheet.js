import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchComments, addComment } from '../lib/socialActions';
import { api } from '../lib/api'; // so we can reuse same baseURL logic

const C = {
  text: '#0F172A',
  dim: 'rgba(15,23,42,0.65)',
  line: 'rgba(2,6,23,0.08)',
  card: '#FFFFFF',
};

/**
 * same logic you used elsewhere:
 * turn relative "profile_image" path into absolute URL
 */
const buildImageUri = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already full URL

 const base = 'https://transrentals.in/';
  const origin = base.replace(/\/api.*$/, ''); // strip any /api...
  const clean = path.replace(/^\/+/, ''); // no leading slash
  const inStorage = clean.startsWith('storage/')
    ? clean
    : `storage/${clean}`;

  return `${origin}/${inStorage}`;
};

/**
 * Reusable avatar
 */
function Avatar({ uri, size = 30, radius = 999 }) {
  const [broken, setBroken] = useState(false);

  if (!uri || broken) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Ionicons
          name="person-outline"
          size={Math.max(14, Math.floor(size * 0.45))}
          color="rgba(15,23,42,0.55)"
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setBroken(true)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
      }}
    />
  );
}

export default function CommentsSheet({ visible, onClose, note, onCommentAdded ,showCustomAlert}) {
  const [items, setItems] = useState([]);
  const [nextAfter, setNextAfter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');

  // fetch first page of comments whenever sheet opens
  useEffect(() => {
    if (!visible || !note?.id) return;
    (async () => {
      setLoading(true);
      try {
        const { data, paging } = await fetchComments(note.id, { limit: 20 });
        setItems(data || []);
        setNextAfter(paging?.next_after || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, note?.id]);

  // pagination
  const loadMore = async () => {
    if (!nextAfter || loading) return;
    setLoading(true);
    try {
      const { data, paging } = await fetchComments(note.id, {
        after: nextAfter,
        limit: 20,
      });
      setItems((prev) => [...prev, ...(data || [])]);
      setNextAfter(paging?.next_after || null);
    } finally {
      setLoading(false);
    }
  };

  // send new comment
  const onSend = async () => {
    const text = body.trim();
    if (!text) return;

    setBody(''); // optimistic clear

    try {
      const created = await addComment(note.id, text, null);

      // prepend the new comment locally
      setItems((prev) => [created, ...prev]);

      // bubble up so feed can update comment count
      if (typeof onCommentAdded === 'function') {
        onCommentAdded(note.id, created);
      }

      showCustomAlert('Success','Comment added successfully');
    } catch (e) {
      showCustomAlert('Error','Failed to add comment');
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* backdrop click to close */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* list of comments */}
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingBottom: 12,
          }}
          onEndReachedThreshold={0.3}
          onEndReached={loadMore}
          renderItem={({ item }) => {
            // extract avatar uri for this commenter
            const commenter = item.vendor || item.author || {};
            const avatarUri = commenter.profile_image
              ? buildImageUri(commenter.profile_image)
              : null;

            return (
              <View style={styles.row}>
                <Avatar uri={avatarUri} size={30} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {commenter.name || 'User'}
                  </Text>
                  <Text style={styles.body}>{item.body}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !loading && (
              <Text
                style={{
                  color: C.dim,
                  textAlign: 'center',
                  marginTop: 20,
                }}
              >
                Be the first to comment
              </Text>
            )
          }
        />

        {/* input row */}
        <View style={styles.inputRow}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write a comment…"
            placeholderTextColor="rgba(38, 39, 41, 0.45)"
            style={styles.input}
            multiline={true}
            maxLength={500}
          />

          <TouchableOpacity onPress={onSend} style={styles.sendBtn}>
            <Ionicons name="send" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: C.line,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  title: { color: C.text, fontWeight: '800', fontSize: 16 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  name: {
    color: C.text,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 3,
  },
  body: {
    color: C.text,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: C.line,
    minHeight: 48,
    maxHeight: 220,
  },
  input: {
    flex: 1,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
  },
  sendBtn: {
    marginLeft: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(2,6,23,0.06)',
  },
});
