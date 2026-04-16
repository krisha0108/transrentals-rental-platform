import EventEmitter from 'eventemitter3';

// Singleton event bus — used to push real-time updates across screens
// without API calls. App.js emits, screens listen.
const AppEvents = new EventEmitter();

export default AppEvents;

// Event names (constants to avoid typos)
export const EVT_NEW_QUOTE   = 'new_quote';   // payload: { serviceType: 'self-drive' }
export const EVT_QUOTE_SENT  = 'quote_sent';  // payload: { serviceType: 'bike' } — vendor submitted a quote
export const EVT_NEW_NOTIF   = 'new_notif';   // payload: none — unread count +1
