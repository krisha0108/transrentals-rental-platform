import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Ensure Ionicons is imported
const buildImageUri = (path) => {
  if (!path) return null;
  // already absolute?
  if (/^https?:\/\//i.test(path)) return path;

  // typical Laravel public disk: Storage::url('vendor_images/..') => '/storage/vendor_images/...'
  // Try to normalize both '/storage/..' and 'vendor_images/..'
  const base = 'https://transrentals.in'; // Replace with your actual base URL
  const origin = base.replace(/\/api.*$/, ''); // strip '/api...' if present
  const clean = path.replace(/^\/+/, ''); // remove leading slashes
  const inStorage = clean.startsWith('storage/') ? clean : `storage/${clean}`;
  console.log("huray",base+inStorage);

  return `${base}/${inStorage}`;
};
export default function ProfileSheet({ visible, onClose, profileStats, followingData, followersData, savedData, vendor, onFollow, onUnfollow,  onUnsave,fetchSaved, buildImageUri    }) {
  const [tab, setTab] = useState('following'); // default to following tab

  if (!visible) return null;
    // Ensure we're working with arrays
  const safeFollowingData = Array.isArray(followingData) ? followingData : [];
  const safeFollowersData = Array.isArray(followersData) ? followersData : [];
  const safeSavedData = Array.isArray(savedData) ? savedData : [];


 const renderNoDataMessage = (message) => (
    <View style={styles.noDataContainer}>
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );
  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar uri={vendor?.profile_image} size={46} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.profileName}>{vendor?.name || 'Your profile'}</Text>
        
            <Text style={styles.profileStats}>
             {profileStats?.followers ?? 0} followers • {profileStats?.following ?? 0} following
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrap}>
          <Tab label="Following" active={tab === 'following'} onPress={() => setTab('following')} />
          <Tab label="Followers" active={tab === 'followers'} onPress={() => setTab('followers')} />
          <Tab label="Saved" active={tab === 'saved'} onPress={() => setTab('saved')} />
        </View>
<View > 
        {/* Display data based on selected tab */}
      {tab === 'following' && (
          safeFollowingData && safeFollowingData.length > 0 ? (
          <FlatList
            data={safeFollowingData}
            renderItem={({ item }) => (
              <View style={styles.profileItem}>
                <Avatar uri={item.profile_image} size={38} />
                <Text>{item.name}</Text>
                <TouchableOpacity onPress={() => onUnfollow(item.id)} style={styles.followButton}>
                  <Text style={styles.followText}>Unfollow</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
  ) :   (
            renderNoDataMessage('No following found')
          )
        )}
        </View>
<View> 
      {tab === 'followers' && (
          safeFollowersData && safeFollowersData.length > 0 ? (
          <FlatList
            data={safeFollowersData}
            renderItem={({ item }) => (
              <View style={styles.profileItem}>
                <Avatar uri={item.profile_image} size={38} />
                <Text>{item.name}</Text>
                <TouchableOpacity onPress={() => {
                      if (item.isFollowing) {
                        onUnfollow(item.id);
                      } else {
                        onFollow(item.id);
                      }
                    }} style={[
                      styles.followButton,
                      item.isFollowing && styles.unfollowButton
                    ]}
>
                   <Text style={[
                      styles.followText,
                      item.isFollowing && styles.unfollowText
                    ]}>
                      {item.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : (
            renderNoDataMessage('No followers found')
          )
        )}
        </View> 
      <View style={{maxHeight:400, height:350, marginBottom: 50}}> 
          {tab === 'saved' && (
            safeSavedData && safeSavedData.length > 0 ? (
              <FlatList
                data={safeSavedData}
              
                renderItem={({ item }) => (
                  <SavedNoteCard 
                    post={item} 
                    onUnsave={() => onUnsave?.(item.id)} 
                    buildImageUri={buildImageUri}

                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              />
            ) : (
              renderNoDataMessage('No saved posts found')
            )
          )}
          </View>
      </View>
    </View>
  );
}

// Tab Component for Profile Navigation
function SavedNoteCard({ post, onUnsave }) {
  const vendor = post.vendor || post.author || {};
  const vendorName = vendor.name || 'Unknown';
    const vendorImage = vendor.profile_image ? buildImageUri(vendor.profile_image) : null; // Use buildImageUri here
console.log("images",vendorImage);
  const category = typeof post.category === 'string' ? post.category : (post.category?.name ?? 'General');
  const isSOS = category.toUpperCase() === 'SOS';

  return (
    <View style={styles.savedCard}>
      {/* Header */}
      <View style={styles.savedCardHeader}>
           <Avatar uri={vendorImage} size={32} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.savedCardVendor}>{vendorName}</Text>
          <View style={[styles.savedCatPill, isSOS && styles.savedCatSOS]}>
            <Ionicons 
              name={isSOS ? "alert-circle" : "pricetags-outline"} 
              size={10} 
              color={isSOS ? "#fff" : "#0891B2"} 
            />
            <Text style={[styles.savedCatText, isSOS && { color: "#fff" }]}>
              {category}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onUnsave} style={styles.unsaveButton}>
          <Ionicons name="bookmark" size={20} color="#0891B2" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.savedCardCaption} numberOfLines={3}>
        {post.caption}
      </Text>

      {/* Stats */}
      <View style={styles.savedCardStats}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="heart" size={16} color="#DC2626" />
            <Text style={styles.statText}>{post.likes || 0}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#0F172A" />
            <Text style={styles.statText}>{post.comments || 0}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Tab Component
function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.tab, active && styles.tabActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}


// Avatar Component to Display Profile Image
function Avatar({ uri, size = 38, radius = 999 }) {
  const [broken, setBroken] = React.useState(false);
console.log("Huryyyyyyy", uri);
  if (!uri || broken) {
    return (
      <View style={{ 
        width: size, 
        height: size, 
        borderRadius: radius, 
        backgroundColor: '#E5E7EB', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
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
      style={{ width: size, height: size, borderRadius: radius }} 
    />
  );
}


const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex:1,
    backgroundColor: '#e8eefdff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: "100%",
    maxHeight: '85%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  profileName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  profileStats: {
    color: 'rgba(15,23,42,0.65)',
    fontSize: 12,
  },
  savedButton: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    justifyContent: 'center',
  },
  savedText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  tabsWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e1e1e1',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  followButton: {
    backgroundColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  followText: {
    fontSize: 12,
    color: '#333',
  },
  savedPostItem: {
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  saveButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
  },
  saveText: {
    fontSize: 12,
    color: '#333',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
    savedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(2,6,23,0.08)',
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedCardVendor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  savedCatPill: {
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
  savedCatSOS: {
    borderColor: 'rgba(236, 28, 28, 0.96)',
    backgroundColor: 'rgba(247, 76, 76, 0.68)',
  },
  savedCatText: {
    color: '#0891B2',
    fontSize: 9,
    fontWeight: '800',
  },
  unsaveButton: {
    padding: 4,
  },
  savedCardCaption: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  savedCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(2,6,23,0.06)',
  },
  statText: {
    color: 'rgba(15,23,42,0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
});
