import React from 'react';

export const NotifBadgeContext = React.createContext({ unreadCount: 0, refreshBadge: () => {} });
