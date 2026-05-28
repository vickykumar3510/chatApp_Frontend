import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useRef,
} from "react";
import { UnreadMessagesContext } from "../contexts/UnreadMessagesContext";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./chat.css";

const socket = io("https://chatapp-backend-v6a6.onrender.com", {
  withCredentials: true
});

const EMOJI_PICKER_NAV_STYLE_ID = "chat-emoji-picker-nav-chrome";
const EMOJI_PICKER_LAYOUT_STYLE_ID = "chat-emoji-picker-layout";

const emojiPickerLayoutCss = () => {
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  return narrow
    ? `
:host {
  width: 100% !important;
  max-width: 100% !important;
  height: clamp(200px, 46vh, 300px) !important;
  min-height: 180px !important;
}
`
    : `
:host {
  width: 100% !important;
  max-width: 352px;
  height: 435px;
  min-height: 230px;
}
`;
};

/** Emoji-mart lives in shadow DOM — nav tint + responsive host size. */
const injectEmojiPickerChrome = (pickerEl) => {
  const shadow = pickerEl?.shadowRoot;
  if (!shadow) return;

  if (!shadow.getElementById(EMOJI_PICKER_NAV_STYLE_ID)) {
    const navStyle = document.createElement("style");
    navStyle.id = EMOJI_PICKER_NAV_STYLE_ID;
    navStyle.textContent = `
#nav button {
  color: #6c757d !important;
}
#nav button:hover,
#nav button:focus-visible {
  color: #4a90e2 !important;
}
#nav button[aria-selected="true"],
#nav button[aria-selected] {
  color: #4a90e2 !important;
}
#nav .bar {
  background-color: #4a90e2 !important;
}
`.trim();
    shadow.appendChild(navStyle);
  }

  let layoutStyle = shadow.getElementById(EMOJI_PICKER_LAYOUT_STYLE_ID);
  if (!layoutStyle) {
    layoutStyle = document.createElement("style");
    layoutStyle.id = EMOJI_PICKER_LAYOUT_STYLE_ID;
    shadow.appendChild(layoutStyle);
  }
  layoutStyle.textContent = emojiPickerLayoutCss();
};

export const Chat = ({ user }) => {
  
  const { unreadCounts, setUnreadCounts } = useContext(UnreadMessagesContext);
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiCompact, setEmojiCompact] = useState(false);
  const typingTimeout = useRef(null);
  const emojiSlotRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setEmojiCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!showEmoji) return;
    const slot = emojiSlotRef.current;
    if (!slot) return;

    const apply = () => {
      const picker = slot.querySelector("em-emoji-picker");
      if (picker) injectEmojiPickerChrome(picker);
    };

    apply();
    const mo = new MutationObserver(apply);
    mo.observe(slot, { childList: true, subtree: true });
    const mq = window.matchMedia("(max-width: 720px)");
    const onResize = () => apply();
    mq.addEventListener("change", onResize);
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(apply, 0);
    const t2 = window.setTimeout(apply, 150);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", onResize);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [showEmoji]);

  /* ---- JOIN SOCKET ---- */
  useEffect(() => {
    if (user?.username) socket.emit("join", user.username);
  }, [user.username]);

  /* ---- LOAD UNREAD COUNTS ---- */
  useEffect(() => {
    if (!user?.username) return;

    const loadUnreadCounts = async () => {
      try {
        const { data } = await axios.get("https://chatapp-backend-v6a6.onrender.com/unread-count", {
          params: { currentUser: user.username },
        });
        setUnreadCounts(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadUnreadCounts();
  }, [user.username, setUnreadCounts]);

  /* ---- FETCH USERS + SOCKET LISTENERS ---- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("https://chatapp-backend-v6a6.onrender.com/users", {
          params: { currentUser: user.username },
        });
        setUsers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();

    socket.on("typing", ({ sender }) => {
      if (sender === currentChat) setIsTyping(true);
    });
    socket.on("stop_typing", ({ sender }) => {
      if (sender === currentChat) setIsTyping(false);
    });
    socket.on("receive_message", (data) => {
      if (data.sender === currentChat || data.receiver === currentChat) {
        setMessages((prev) => [...prev, data]);
      } else if (data.receiver === user.username) {
        setUnreadCounts((prev) => ({
          ...prev,
          [data.sender]: (prev[data.sender] || 0) + 1,
        }));
      }
    });
    socket.on("message_delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "delivered" } : m))
      );
    });
    socket.on("message_seen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "seen" } : m))
      );
    });

    return () => {
      socket.off("typing");
      socket.off("stop_typing");
      socket.off("receive_message");
      socket.off("message_delivered");
      socket.off("message_seen");
    };
  }, [currentChat, user.username, setUnreadCounts]);

  /* ---- FETCH MESSAGES ---- */
  const fetchMessages = async (receiver) => {
    try {
      const { data } = await axios.get("https://chatapp-backend-v6a6.onrender.com/messages", {
        params: { sender: user.username, receiver },
      });

      setMessages(data);
      setCurrentChat(receiver);

      data.forEach((msg) => {
        if (msg.receiver === user.username && msg.status !== "seen") {
          socket.emit("mark_seen", { messageId: msg._id, sender: msg.sender });
        }
      });

      setUnreadCounts((prev) => ({ ...prev, [receiver]: 0 }));
    } catch (err) {
      console.error(err);
    }
  };

  /* ---- SEND MESSAGE ---- */
  const sendMessage = () => {
    setShowEmoji(false);
    if (!currentMessage.trim()) return;

    socket.emit("send_message", {
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
    });

    setCurrentMessage("");
    socket.emit("stop_typing", { sender: user.username, receiver: currentChat });
  };

  /* ---- TYPING ---- */
  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    socket.emit("typing", { sender: user.username, receiver: currentChat });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { sender: user.username, receiver: currentChat });
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addEmoji = (emoji) => {
    setCurrentMessage((prev) => prev + emoji.native);
  };

  /* log out button*/
  const handleLogout = () => {
    socket.disconnect();
    localStorage.removeItem("user")
    window.location.href = "/login";
  }


  const initials = (name) =>
    String(name || "?")
      .slice(0, 2)
      .toUpperCase();

  const sidebarUsers = users.filter(
    (u) => u.username && u.username !== user.username
  );

  return (
    <div className="chat-app">
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div className="chat-user-pill">
            <div className="chat-avatar" aria-hidden="true">
              {initials(user.username)}
            </div>
            <div className="chat-user-meta">
              <div className="name">{user.username}</div>
              <div className="hint">Signed in</div>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
        <div className="chat-sidebar-section-title">Conversations</div>
        <div className="chat-user-list">
          {sidebarUsers.length === 0 && (
            <div className="chat-user-meta hint" style={{ padding: "0 0.5rem" }}>
              No other users yet.
            </div>
          )}
          {sidebarUsers.map((u) => (
            <div
              key={u._id}
              className={`chat-user ${currentChat === u.username ? "active" : ""}`}
              onClick={() => fetchMessages(u.username)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fetchMessages(u.username);
                }
              }}
            >
              <span>{u.username}</span>
              {unreadCounts[u.username] > 0 && (
                <span className="unread-count">{unreadCounts[u.username]}</span>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        {!currentChat ? (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">
              💬
            </div>
            <h2>Select a conversation</h2>
            <p>
              Pick someone from the list to send messages and see your history.
            </p>
          </div>
        ) : (
          <div className="chat-window">
            <header className="chat-main-toolbar">
              <div className="toolbar-avatar" aria-hidden="true">
                {initials(currentChat)}
              </div>
              <div className="toolbar-text">
                <h2>{currentChat}</h2>
              </div>
            </header>

            <div className="message-list-wrap">
              <MessageList
                messages={messages}
                user={user}
                currentChat={currentChat}
                onSeen={(msg) =>
                  socket.emit("mark_seen", { messageId: msg._id, sender: msg.sender })
                }
              />
              {isTyping && (
                <div className="typing-indicator">
                  <span>{currentChat} is typing…</span>
                </div>
              )}
            </div>

            <div className="composer">
              <div className="message-field">
                <input
                  type="text"
                  value={currentMessage}
                  placeholder="Write a message…"
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  aria-label="Message"
                />
                <button
                  type="button"
                  className="btn-prime btn-emoji"
                  onClick={() => setShowEmoji((p) => !p)}
                  title="Emoji"
                >
                  ☺
                </button>
                <button
                  type="button"
                  className="btn-prime btn-prime-send"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
              {showEmoji && (
                <div className="emoji-popover-wrap">
                  <div className="emoji-popover-slot" ref={emojiSlotRef}>
                    <Picker
                      key={emojiCompact ? "emoji-compact" : "emoji-full"}
                      data={data}
                      onEmojiSelect={addEmoji}
                      set="native"
                      theme="light"
                      dynamicWidth
                      emojiButtonSize={emojiCompact ? 30 : 36}
                      emojiSize={emojiCompact ? 20 : 24}
                      maxFrequentRows={emojiCompact ? 2 : 4}
                    />
                  </div>
                  <div className="emoji-popover-close-bar">
                    <button
                      type="button"
                      className="emoji-popover-close"
                      onClick={() => setShowEmoji(false)}
                      aria-label="Close emoji picker"
                      title="Close"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
