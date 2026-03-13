import { apiGet, apiPost, apiDelete } from './client';

// ── Feed ──────────────────────────────────────────────────────────────
export const getSocialFeed = (cursor, categoryId) => {
  let q = '';
  if (cursor || categoryId) {
    const p = new URLSearchParams();
    if (cursor) p.append('cursor', cursor);
    if (categoryId) p.append('categoryId', categoryId);
    q = `?${p.toString()}`;
  }
  return apiGet(`/vendor/social/posts${q}`);
};
export const getSocialSOS = () => apiGet('/vendor/social/posts?type=sos');
export const getSocialSaved = (cursor) => {
  const p = new URLSearchParams({ type: 'saved' });
  if (cursor) p.append('cursor', cursor);
  return apiGet(`/vendor/social/posts?${p.toString()}`);
};
export const getSocialCategories = () => apiGet('/admin/social/categories');
export const createSocialPost = (content, categoryId) =>
  apiPost('/vendor/social/posts', { content, categoryId });
export const deleteSocialPost = (postId) => apiDelete(`/vendor/social/posts/${postId}`);
export const toggleLike = (postId) => apiPost(`/vendor/social/posts/${postId}/like`);
export const toggleSave = (postId) => apiPost(`/vendor/social/posts/${postId}/save`);
export const toggleFollow = (followingId) => apiPost('/vendor/social/follow', { followingId });
export const getComments = (postId) => apiGet(`/vendor/social/posts/${postId}/comment`);
export const addComment = (postId, content) =>
  apiPost(`/vendor/social/posts/${postId}/comment`, { content });
export const deleteComment = (postId, commentId) =>
  apiDelete(`/vendor/social/posts/${postId}/comment/${commentId}`);
export const getSocialProfile = (vendorId) => apiGet(`/vendor/social/profile/${vendorId}`);

// ── Chat ──────────────────────────────────────────────────────────────
export const getConversations = () => apiGet('/vendor/social/chat/conversations');
export const getOrCreateConversation = (otherVendorId) =>
  apiPost('/vendor/social/chat/conversations', { otherVendorId });
export const getMessages = (conversationId) =>
  apiGet(`/vendor/social/chat/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, content) =>
  apiPost(`/vendor/social/chat/conversations/${conversationId}/messages`, { content });
