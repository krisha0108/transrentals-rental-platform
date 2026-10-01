// services/storiesService.js - Web stories (travel guides) shown in the app
import api, { BASE_URL } from '../api';

// Story images are stored as site-relative paths (/uploads/web-stories/...).
export const storyImageUri = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// The story page on the website, which the app shows in a WebView so every
// story looks exactly as it was designed.
export const storyPageUrl = (slug) => `${BASE_URL}/stories/${encodeURIComponent(slug)}`;

const slugify = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Whether a story is about a city: it targets the city, or names it in its
 * title, category or slug. Stories targeted at "everywhere" don't count.
 * The server applies the same rule for `?city=`; it is repeated here so the
 * app is right even against a server that doesn't support that filter yet.
 */
export const storyMatchesCity = (story, city) => {
  const name = String(city || '').trim().toLowerCase();
  if (!name) return true;
  const citySlug = slugify(name);
  if ((story.locations || []).some((l) => String(l).toLowerCase() === citySlug)) return true;
  const text = `${story.title || ''} ${story.category || ''}`.toLowerCase();
  return text.includes(name) || `-${String(story.slug || '').toLowerCase()}-`.includes(`-${citySlug}-`);
};

const storiesService = {
  /**
   * Published stories, newest and pinned first.
   * @param {{city?: string}} [options] - only stories about this city
   * @returns {Promise<object[]>}
   */
  getStories: async ({ city } = {}) => {
    const response = await api.get('/web-stories', { params: city ? { city } : undefined });
    const stories = response.data?.stories || [];
    return city ? stories.filter((s) => storyMatchesCity(s, city)) : stories;
  },

  /**
   * All stories with the ones admin marked Popular (featured) first, each
   * group keeping the admin's order. A server that doesn't report
   * `isFeatured` yet just gives the normal order.
   * @returns {Promise<object[]>}
   */
  getPopularFirst: async () => {
    const stories = await storiesService.getStories();
    return [...stories.filter((s) => s.isFeatured === true), ...stories.filter((s) => s.isFeatured !== true)];
  },
};

export default storiesService;
