import React, { useState, useEffect, useContext, useRef } from "react";
import { UnreadMessagesContext } from "../contexts/UnreadMessagesContext";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./chat.css";

const socket = io("https://chatapp-backend-v6a6.onrender.com");

export const Chat = ({ user }) => {
  
  const { unreadCounts, setUnreadCounts } = useContext(UnreadMessagesContext);
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeout = useRef(null);

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


  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>

      <div className="chat-list">
        <button className="logoutBtn" onClick={handleLogout}>Log Out</button><br/><br/>

        <h3>Chats</h3>
        {users.filter((u) => u.username && u.username !== user.username).map((u) => (
          <div
            key={u._id}
            className={`chat-user ${currentChat === u.username ? "active" : ""}`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
            {unreadCounts[u.username] > 0 && (
              <span className="unread-count">{unreadCounts[u.username]}</span>
            )}
          </div>
        ))}
      </div>

      {currentChat && (
        <div className="chat-window">
          <h5 style={{"color" : "gray"}}>You are chatting with {currentChat}</h5>

          <MessageList
            messages={messages}
            user={user}
            onSeen={(msg) =>
              socket.emit("mark_seen", { messageId: msg._id, sender: msg.sender })
            }
          />

          {isTyping && <div className="typing-indicator">{currentChat} is typing...</div>}

          <div className="message-field">
            <input
              type="text"
              value={currentMessage}
              placeholder="Type a message..."
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-prime" onClick={() => setShowEmoji((p) => !p)}>
              😀
            </button>
            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>

          {showEmoji && <Picker data={data} onEmojiSelect={addEmoji} />}
        </div>
      )}
    </div>
  );
};
