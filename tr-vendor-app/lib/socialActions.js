// lib/socialActions.js
import { api } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCategories() {
  const { data } = await api.get('/vendor/social/categories');
  return data?.data || [];
}

export async function createNote({ caption, category_id }) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  if (!vendorId) throw new Error('Missing vendor_id in storage');

  const res = await api.post('/vendor/social/notes', {
    vendor_id: Number(vendorId),
    category_id,
    caption,
  });
  return res.data?.data || res.data;
}

export async function fetchFeed({ tab='explore', page=1, page_size=20 }) {
  const vendorId = await AsyncStorage.getItem('vendor_id');  // may be null
  const params = { tab, page, page_size };
  if (vendorId) params.vendor_id = Number(vendorId);

  const { data } = await api.get('/vendor/social/feed', { params });
  return {
    items: data?.data || [],
    pagination: data?.pagination || { current_page: page, last_page: page, total: 0 },
  };
}

export async function fetchHighlights(limit=20) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get('/vendor/social/highlights', {
    params: { vendor_id: vendorId ? Number(vendorId) : undefined, limit }
  });
  return data?.data || [];
}

// LIKE / UNLIKE (send vendor_id)
export async function likeNote(id) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  return api.post(`/vendor/social/notes/${id}/like`, { vendor_id: Number(vendorId) });
}
export async function unlikeNote(id) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  return api.delete(`/vendor/social/notes/${id}/like`, { data: { vendor_id: Number(vendorId) }});
}

// SAVE / UNSAVE (send vendor_id)
export async function saveNote(id) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  return api.post(`/vendor/social/notes/${id}/save`, { vendor_id: Number(vendorId) });
}
export async function unsaveNote(id) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  return api.delete(`/vendor/social/notes/${id}/save`, { data: { vendor_id: Number(vendorId) }});
}

// COMMENTS
export async function fetchComments(noteId, { after=null, limit=20 } = {}) {
  const { data } = await api.get(`/vendor/social/notes/${noteId}/comments`, {
    params: { after, limit }
  });
  return data;
}
export async function addComment(noteId, body, parent_id=null) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.post(`/vendor/social/notes/${noteId}/comments`, {
    vendor_id: Number(vendorId),
    body,
    parent_id,
  });
  return data;
}
export async function deleteComment(commentId) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.delete(`/vendor/social/comments/${commentId}`, {
    data: { vendor_id: Number(vendorId) }
  });
  return data;
}

// SAVED FEED (if you add the endpoint)
export async function fetchSaved({ page=1, page_size=20 } = {}) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get('/vendor/social/saved', {
    params: { vendor_id: Number(vendorId), page, page_size }
  });
  return { items: data?.data || [], pagination: data?.pagination };
}
export async function fetchMyProfile() {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get('/vendor/social/profile/' + Number(vendorId));
  return data; // { stats, vendor: {...}, recent_notes: [...] }
}

export async function fetchMyNotes({ after=null, page_size=20 } = {}) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get('/vendor/social/me/notes', {
    params: { vendor_id: Number(vendorId), after, page_size }
  });
  return data; // { data: Note[], paging: { next_after } }
}
// export async function fetchFollowing() {
//   const vendorId = await AsyncStorage.getItem('vendor_id');
//   console.log('Fetched vendorId:', vendorId);  // Check if vendorId is fetched properly
//   try {
//     const response = await api.get(`/vendor/social/${vendorId}/following`);
//     return response.data;  // Assuming the response contains the following data
//   } catch (error) {
//     console.error('Error fetching following data:', error);
//     return [];  
//   }
// }
export async function fetchFollowing() {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  console.log('Fetching following for vendorId:', vendorId);
  
  try {
    // Remove vendorId from URL - it will be sent in header via interceptor
    const response = await api.get(`/vendor/social/following`);
    
    console.log('Following response:', response.data);
    
    // Extract data array from response - adjust based on your backend structure
    const followingList = response.data?.data || response.data?.following || response.data || [];
    
    return Array.isArray(followingList) ? followingList : [];
  } catch (error) {
    console.error('Error fetching following data:', error);
    console.error('Error response:', error.response?.data);
    return [];  
  }
}


export async function fetchFollowers() {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  console.log('Fetching followers for vendorId:', vendorId);
  
  try {
    // Remove vendorId from URL - it will be sent in header via interceptor
    const response = await api.get(`/vendor/social/followers`);
    
    console.log('Followers response:', response.data);
    
    // Extract data array from response - adjust based on your backend structure
    const followersList = response.data?.data || response.data?.followers || response.data || [];
    
    return Array.isArray(followersList) ? followersList : [];
  } catch (error) {
    console.error('Error fetching followers data:', error);
    console.error('Error response:', error.response?.data);
    return [];
  }
}


export async function fetchSavedProfile() {
   const vendorId = await AsyncStorage.getItem('vendor_id');
  try {
    const response = await api.get(`/vendor/social/${vendorId}/savedprofile`);
    return response.data;  // assuming the response contains the saved posts data
  } catch (error) {
    console.error('Error fetching saved data:', error);
    return [];
  }
}
export const getFollowStatus = async () => {
   const vendorId = await AsyncStorage.getItem('vendor_id');
  try {
    const response = await axios.get(`/vendor/social/follow-status/${vendorId}`);
    return response.data; // Assuming the response has the follow status as part of its data
  } catch (error) {
    console.error("Error fetching follow status:", error);
    throw error;  // Optional: You can throw the error to be handled in the component
  }
};
export async function searchNotes(query, { limit = 20 } = {}) {
  const vendorId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get('/vendor/social/search/notes', {
    params: {
      q: query,
      vendor_id: vendorId ? Number(vendorId) : undefined,
      limit,
    },
  });
  return data?.data || [];
}

export async function searchUsers(query, { limit = 20 } = {}) {
  const { data } = await api.get('/vendor/social/search/users', {
    params: { q: query, limit },
  });
  return data?.data || [];
}
export async function fetchVendorNotesById(targetVendorId, { limit = 50 } = {}) {
  // who is viewing? this is the logged-in vendor_id
  const viewerId = await AsyncStorage.getItem('vendor_id');
  const { data } = await api.get(`/vendor/social/vendor-notes/${targetVendorId}`, {
    params: {
      viewer_id: viewerId ? Number(viewerId) : undefined,
      limit,
    },
  });
  // We expect either { data: [...] } or just an array
  const rawList = Array.isArray(data) ? data : (data?.data || []);
  // Normalize each note so UI never explodes if backend omits fields
  return rawList.map(note => ({
    ...note,
    id: note.id,
    caption: note.caption ?? "",
    created_at: note.created_at ?? null,
    timeAgo: note.timeAgo ?? note.created_at ?? "",
    likes: note.likes ?? 0,
    comments: note.comments ?? 0,
    liked: !!note.liked,
    saved: !!note.saved,
    category: note.category ?? { id: note.category_id, name: note.category_name || "General" },
    vendor: note.vendor ?? note.author ?? {
      id: note.vendor_id ?? null,
      name: note.vendor_name ?? "Unknown",
      profile_image: note.vendor_profile_image ?? null,
    },
    isFollowing: !!note.isFollowing,
  }));
}
// Fetch profile info for that vendor (name, avatar, stats, follow state)
export async function fetchVendorProfileById(targetVendorId) {
  console.log('hii');
  const viewerId = await AsyncStorage.getItem('vendor_id');
  try {
    const { data } = await api.get(`/vendor/social/profileNote/${targetVendorId}`, {
      params: {
        viewer_id: viewerId ? Number(viewerId) : undefined,
      },
    });
    // We expect something like:
    // {
    //   id,
    //   name,
    //   profile_image,
    //   stats: { followers, following, notes },
    //   isFollowing: true/false
    // }
    return {
      id: data?.id ?? targetVendorId,
      name: data?.name ?? "",
      profile_image: data?.profile_image ?? null,
      stats: data?.stats ?? null,
      isFollowing: !!data?.isFollowing,
    };
  } catch (err) {
    console.log("fetchVendorProfileById error", err?.response?.data || err.message);
    return null;
  }
}