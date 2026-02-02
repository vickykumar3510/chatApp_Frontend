import React, { useEffect, useLayoutEffect, useRef } from "react";
import "./chat.css";

const MessageList = ({ messages, user, currentChat, onSeen }) => {
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);

  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusIcon = (status) => {
    if (status === "sent") return "✓";
    if (status === "delivered") return "✓✓";
    if (status === "seen") return "✓✓";
    return "";
  };

  const formatDate = (date) => {
    const msgDate = new Date(date);
    const today = new Date();

    if (msgDate.toDateString() === today.toDateString()) return "Today";

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";

    return msgDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // scroll to bottom instantly when switching chats
  useLayoutEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [currentChat, messages.length]);

  // For new messages in same chat → scroll only if user is near bottom
  useEffect(() => {
    if (!messageListRef.current || !messagesEndRef.current || messages.length === 0) return;

    const list = messageListRef.current;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 100) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="message-list" ref={messageListRef}>
      {messages.map((msg, index) => {
        const showDate =
          index === 0 ||
          new Date(messages[index - 1].createdAt).toDateString() !==
            new Date(msg.createdAt).toDateString();

        if (msg.receiver === user.username && msg.status !== "seen") {
          onSeen(msg);
        }

        return (
          <React.Fragment key={msg._id}>
            {showDate && (
              <div className="date-separator">{formatDate(msg.createdAt)}</div>
            )}

            <div
              className={`message ${
                msg.sender === user.username ? "sent" : "received"
              }`}
            >
              <strong>{msg.sender}: </strong>
              {msg.message}

              <div className="message-meta">
                <small>{formatTime(msg.createdAt)}</small>

                {msg.sender === user.username && (
                  <small className={`status ${msg.status}`}>
                    {getStatusIcon(msg.status)}
                  </small>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
