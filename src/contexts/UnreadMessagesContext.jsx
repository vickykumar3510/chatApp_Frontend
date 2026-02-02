import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ user, children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch initial unread counts
  const fetchUnreadCounts = async () => {
    if (!user?.username) return;
    try {
      const { data } = await axios.get("https://chat-app-backend-delta-ten.vercel.app/unread-count", {
        params: { currentUser: user.username },
      });
      setUnreadCounts(data);
    } catch (err) {
      console.error("Error fetching unread counts", err);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
  }, [user]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCounts, setUnreadCounts }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
