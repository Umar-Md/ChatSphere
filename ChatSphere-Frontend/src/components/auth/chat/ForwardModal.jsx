import { useState } from "react";

export default function ForwardModal({ message, conversations, currentUserId, onForward, onClose }) {
  const [sending, setSending] = useState(null);
  if (!message) return null;

  const getName = (conversation) => {
    if (conversation.isGroup) return conversation.groupName || "Group";
    const other = (conversation.participants || []).find(
      (p) => String(p._id) !== String(currentUserId)
    );
    return other?.name || other?.email || "Chat";
  };

  const handleForward = async (conversation) => {
    try {
      setSending(conversation._id);
      await onForward(conversation);
      onClose();
    } catch {
      // Parent displays the actual error.
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold text-lg">Forward message</h2>
          <button onClick={onClose} className="text-xl text-gray-500">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              type="button"
              disabled={sending === conversation._id}
              onClick={() => handleForward(conversation)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-gray-50 disabled:opacity-50"
            >
              <img
                src={
                  conversation.isGroup
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.groupName || "Group")}`
                    : conversation.participants?.find(
                        (p) => String(p._id) !== String(currentUserId)
                      )?.profilePic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(getName(conversation))}`
                }
                className="h-10 w-10 rounded-full object-cover"
                alt=""
              />
              <span className="font-medium">{getName(conversation)}</span>
              {sending === conversation._id && (
                <span className="ml-auto text-xs text-gray-500">Sending…</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
