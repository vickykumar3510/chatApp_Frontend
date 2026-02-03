import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const UnreadMessagesContext = createContext();

export const UnreadMessagesProvider = ({ user, children }) => {
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch initial unread counts
  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.username) return;
    try {
      const { data } = await axios.get(
        "https://chatapp-backend-v6a6.onrender.com/unread-count",
        {
          params: { currentUser: user.username },
        }
      );
      setUnreadCounts(data);
    } catch (err) {
      console.error("Error fetching unread counts", err);
    }
  }, [user?.username]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCounts, setUnreadCounts }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
