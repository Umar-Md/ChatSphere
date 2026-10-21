import { useEffect, useRef, useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";
import { sendMessage, scheduleMessage } from "../../../services/chatService";
import VoiceRecorder from "./VoiceRecorder";
import {
  getSocket,
} from "../../../services/socket";
import MediaPreview from "./MediaPreview";
function MessageInput({
  conversation,
  onMessageSent,
  onOpenAI,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [expiresIn, setExpiresIn] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const { t } = usePreferences();
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  const currentUserId = getCurrentUserId();

  const other =
    conversation?.participants?.find(
      (p) => String(p._id) !== String(currentUserId)
    ) || conversation?.participants?.[0];

  const send = async () => {
  if (
    !text.trim() &&
    !file &&
    !audioFile
  ) {
    return;
  }

  if (
    !conversation?.isGroup &&
    !other?._id
  ) {
    return;
  }

  if (conversation?.isGroup && !conversation?._id) {
    return;
  }

  setSending(true);

  try {
    const message =
      await sendMessage({
        receiverId:
          conversation.isGroup
            ? undefined
            : other?._id,

        conversationId:
          conversation.isGroup
            ? conversation._id
            : undefined,

        text: text.trim(),

        file: file || audioFile || undefined,

        expiresIn:
          expiresIn || undefined,
      });

    setText("");
    setFile(null);
    setExpiresIn("");
    setAudioFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    onMessageSent(message);
  } catch (error) {
    console.error(
      "Send message failed:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Failed to send message"
    );
  } finally {
    setSending(false);
  }
};

  const schedule = async () => {
  if (
    !text.trim() ||
    !scheduledAt ||
    !conversation?._id ||
    (!conversation.isGroup && !other?._id)
  ) {
    alert(
      "Enter message and future date/time."
    );
    return;
  }

  const selectedTime = new Date(
    scheduledAt
  );

  if (
    Number.isNaN(selectedTime.getTime()) ||
    selectedTime <= new Date()
  ) {
    alert(
      "Scheduled time must be in the future."
    );
    return;
  }

  try {
    await scheduleMessage({
      conversationId:
        conversation._id,

      receiverId:
        conversation.isGroup
          ? undefined
          : other?._id,

      text: text.trim(),

      scheduledAt:
        selectedTime.toISOString(),

      messageType: "text",
    });

    alert(
      "Message scheduled successfully."
    );

    setText("");
    setScheduledAt("");
    setShowSchedule(false);
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Failed to schedule message"
    );
  }
};
  const typingTimerRef = useRef(null);
  const handleTyping = (value) => {
  setText(value);

  const socket = getSocket();

  if (!socket || !conversation) {
    return;
  }

  if (conversation.isGroup) {
    socket.emit("typing", {
      conversationId: conversation._id,
    });
  } else if (other?._id) {
    socket.emit("typing", {
      receiverId: other._id,
    });
  }

  if (typingTimerRef.current) {
    clearTimeout(
      typingTimerRef.current
    );
  }

  typingTimerRef.current = setTimeout(() => {
    if (conversation.isGroup) {
      socket.emit("stopTyping", {
        conversationId:
          conversation._id,
      });
    } else if (other?._id) {
      socket.emit("stopTyping", {
        receiverId: other._id,
      });
    }
  }, 1000);
};
  useEffect(() => {
    const handleUseReply = (event) => {
      const reply = String(event.detail || "");
      if (reply.trim()) setText(reply);
    };
    window.addEventListener("chatsphere-use-reply", handleUseReply);
    return () => window.removeEventListener("chatsphere-use-reply", handleUseReply);
  }, []);

  useEffect(() => {
  return () => {
    if (typingTimerRef.current) {
      clearTimeout(
        typingTimerRef.current
      );
    }
  };
}, []);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!conversation) return null;

  return (
    <div className="bg-white border-t p-3">
      {audioFile && (
        <div className="mb-2 flex items-center justify-between bg-green-50 p-2 rounded-lg">
          <span className="text-sm truncate">🎤 {audioFile.name}</span>
          <button onClick={() => setAudioFile(null)}>×</button>
        </div>
      )}

      {file && (
  <MediaPreview
    file={file}
    onRemove={() => {
      setFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }}
  />
)}

      {showMore && (
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="px-3 py-2 bg-gray-100 rounded-lg cursor-pointer">
  📎 Media

    <input
      ref={fileRef}
      type="file"
      accept="
        image/jpeg,
        image/png,
        image/webp,
        video/mp4,
        video/mpeg,
        video/quicktime,
        video/webm,
        audio/mpeg,
        audio/wav,
        audio/x-wav,
        audio/mp4,
        audio/webm,
        audio/x-m4a,
        application/pdf,
        application/msword,
        application/vnd.openxmlformats-officedocument.wordprocessingml.document,
        text/plain
      "
      hidden
      onChange={(e) => {
      const selectedFile = e.target.files?.[0] || null;

      console.log("Selected file:", selectedFile);
      console.log("File name:", selectedFile?.name);
      console.log("File type:", selectedFile?.type);
      console.log("File size:", selectedFile?.size);

      setFile(selectedFile);
    }}
    />
  </label>

          <button
            onClick={() =>
              setExpiresIn(expiresIn ? "" : "30")
            }
            className={`px-3 py-2 rounded-lg ${
              expiresIn ? "bg-red-100 text-red-600" : "bg-gray-100"
            }`}
          >
            💣 Self-destruct {expiresIn ? "(30s)" : ""}
          </button>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="px-3 py-2 bg-gray-100 rounded-lg"
          >
            🕐 {t("schedule")}
          </button>
        </div>
      )}

      {showSchedule && (
        <div className="mb-3 p-3 border rounded-xl bg-gray-50">
          <label className="text-sm font-medium">Send at</label>
          <div className="flex flex-col gap-2 mt-2 sm:flex-row">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="min-w-0 border rounded-lg px-3 py-2 flex-1"
            />
            <button
              onClick={schedule}
              className="bg-indigo-600 text-white px-4 rounded-lg"
            >
              Schedule
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 items-end gap-1 sm:gap-2">
        <button
          onClick={() => setShowMore(!showMore)}
          className="shrink-0 w-10 h-11 sm:w-11 rounded-full hover:bg-gray-100 text-xl"
        >
          +
        </button>

        <textarea
          rows="1"
          value={text}
          onChange={(e) =>
            handleTyping(e.target.value)
          }
          placeholder={t("typeMessage")}
          className="min-w-0 flex-1 resize-none border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          onClick={onOpenAI}
          className="shrink-0 w-10 h-11 sm:w-11 rounded-full bg-purple-100 text-purple-600 font-bold"
          title="AI Assistant"
        >
          ✨
        </button>

        <VoiceRecorder onRecordingComplete={(audio) => setAudioFile(audio)} />

        <button
          onClick={send}
          disabled={sending}
          className="shrink-0 w-10 h-11 sm:w-11 rounded-full bg-indigo-600 text-white disabled:opacity-50"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function getCurrentUserId() {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || payload._id || payload.userId;
  } catch {
    return null;
  }
}

export default MessageInput;
