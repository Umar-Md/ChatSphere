import { useEffect, useRef, useState } from "react";

import BookmarkButton from "./BookmarkButton";
import SelfDestructSelector from "./SelfDestructSelector";

import {
  editMessage,
  deleteMessage,
} from "../../../services/messageService";

import { usePreferences } from "../../../context/AppPreferences";
import TranslationButton from "./TranslationButton";
import PollCard from "../poll/pollCard";
function ChatWindow({
  messages,
  currentUserId,
  searchQuery = "",
  selectionMode = false,
  selectedMessageIds = [],
  onToggleMessage,
  onDeleteSelected,
  onCancelSelection,
  onForwardMessage,
  isGroup = false,
}) {
  const { t, language } = usePreferences();

  const bottomRef = useRef(null);

  const [openMenu, setOpenMenu] =
    useState(null);

  useEffect(() => {
    if (!openMenu) return;

    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-message-options-menu]")) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenu]);

  const [localMessages, setLocalMessages] =
    useState(messages || []);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    if (!searchQuery) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [localMessages, searchQuery]);

  const normalizedSearch =
    searchQuery.trim().toLowerCase();

  const filteredMessages = normalizedSearch
    ? localMessages.filter((message) => {
        const text = String(
          message.text ||
            message.content ||
            ""
        ).toLowerCase();

        return text.includes(
          normalizedSearch
        );
      })
    : localMessages;

  if (!localMessages.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#f7f8fc] text-gray-400">
        <div className="text-center">
          <div className="mb-3 text-5xl">
            💬
          </div>

          <p className="font-medium">
            No messages yet
          </p>

          <p className="mt-1 text-sm">
            Say hello 👋
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f7f8fc] p-5">
      {/* Selection toolbar */}
      {selectionMode && (
        <div className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-white px-4 py-3 shadow-lg">
          <div>
            <p className="font-semibold text-gray-900">
              Select messages
            </p>

            <p className="text-xs text-gray-500">
              {selectedMessageIds.length} selected
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelSelection}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                selectedMessageIds.length === 0
              }
              onClick={onDeleteSelected}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              🗑️ Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Search results information */}
      {normalizedSearch && (
        <div className="sticky top-0 z-10 mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <strong>
            {filteredMessages.length}
          </strong>{" "}
          message
          {filteredMessages.length === 1
            ? ""
            : "s"}{" "}
          found for{" "}
          <strong>
            "{searchQuery}"
          </strong>
        </div>
      )}

      {/* No search results */}
      {normalizedSearch &&
        filteredMessages.length === 0 && (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-4xl">
                🔎
              </div>

              <p className="font-semibold text-gray-700">
                No matching messages
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try another search term.
              </p>
            </div>
          </div>
        )}

      <div className="mx-auto max-w-4xl space-y-4">
        {filteredMessages.map((message) => {
          const mine =
            String(
              message.sender?._id ||
                message.sender
            ) === String(currentUserId);

          const selected =
            selectedMessageIds.some(
              (id) =>
                String(id) ===
                String(message._id)
            );

          return (
            <div
              key={message._id}
              className={`flex ${
                mine
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {/* Selection checkbox */}
              {selectionMode && (
                <button
                  type="button"
                  onClick={() =>
                    onToggleMessage?.(
                      message._id
                    )
                  }
                  className={`mr-3 mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-gray-400 bg-white hover:border-indigo-500"
                  }`}
                  aria-label={
                    selected
                      ? "Deselect message"
                      : "Select message"
                  }
                >
                  {selected && "✓"}
                </button>
              )}

              <div className="relative min-w-0 max-w-[90%] sm:max-w-[75%]" data-message-menu>
                {/* Message bubble */}
                <div
                  onClick={() => {
                    if (selectionMode) {
                      onToggleMessage?.(
                        message._id
                      );
                    }
                  }}
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    mine
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-white text-gray-800"
                  } ${
                    selectionMode
                      ? "cursor-pointer"
                      : ""
                  } ${
                    selected
                      ? "ring-4 ring-indigo-300 ring-offset-2"
                      : ""
                  }`}
                >
                  {isGroup && !mine && (
                    <p className="mb-1 text-xs font-semibold text-indigo-600">
                      {message.sender?.username ||
                        message.sender?.name ||
                        message.sender?.fullName ||
                        "Unknown user"}
                    </p>
                  )}
                  <MessageContent
                    message={message}
                    mine={mine}
                  />

                  {/* Bottom information */}
                  <div
                    className={`mt-2 flex items-center justify-end gap-2 text-[10px] ${
                      mine
                        ? "text-indigo-100"
                        : "text-gray-400"
                    }`}
                  >
                    <span>
                      {message.createdAt
                        ? new Date(
                            message.createdAt
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : ""}
                    </span>

                    {/* Delivery / read */}
                    {mine && (
                      <span>
                        {message.isRead
                          ? "✓✓"
                          : message.isDelivered
                          ? "✓✓"
                          : "✓"}
                      </span>
                    )}

                    {/* Self destruct */}
                    {message.isSelfDestruct && (
                      <span>
                        💣{" "}
                        {getExpiryText(
                          message
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual message menu */}
                {!selectionMode && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu(
                          openMenu ===
                            message._id
                            ? null
                            : message._id
                        )
                      }
                      className="absolute -right-9 top-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
                      title="Message options"
                    >
                      ⋮
                    </button>

                    {openMenu ===
                      message._id && (
                      <div
                        data-message-options-menu
                        className="absolute right-0 top-10 z-30 min-w-[200px] rounded-xl border bg-white p-2 shadow-xl"
                      >
                        {/* Edit */}
                        {mine &&
                          message.messageType ===
                            "text" &&
                          !message.isRead && (
                            <button
                              type="button"
                              className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50"
                              onClick={async () => {
                                const next =
                                  window.prompt(
                                    "Edit message",
                                    message.text ||
                                      message.content ||
                                      ""
                                  );

                                if (
                                  next ===
                                    null ||
                                  !next.trim() ||
                                  next.trim() ===
                                    (message.text ||
                                      message.content ||
                                      "")
                                ) {
                                  return;
                                }

                                try {
                                  const result =
                                    await editMessage(
                                      message._id,
                                      next.trim()
                                    );

                                  const updated =
                                    result.data
                                      ?.message ||
                                    result.data ||
                                    result;

                                  setLocalMessages(
                                    (prev) =>
                                      prev.map(
                                        (item) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            message._id
                                          )
                                            ? {
                                                ...item,
                                                ...updated,
                                                text: next.trim(),
                                              }
                                            : item
                                      )
                                  );

                                  setOpenMenu(null);
                                } catch (error) {
                                  alert(
                                    error.response
                                      ?.data
                                      ?.message ||
                                      "Unable to edit message"
                                  );
                                }
                              }}
                            >
                              ✏️ Edit message
                            </button>
                          )}

                        {/* Individual delete */}
                        {mine && (
                          <button
                            type="button"
                            className="w-full rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  "Delete this message?"
                                )
                              ) {
                                return;
                              }

                              try {
                                await deleteMessage(
                                  message._id
                                );

                                setLocalMessages(
                                  (prev) =>
                                    prev.filter(
                                      (item) =>
                                        String(
                                          item._id
                                        ) !==
                                        String(
                                          message._id
                                        )
                                    )
                                );

                                setOpenMenu(null);
                              } catch (error) {
                                alert(
                                  error.response
                                    ?.data
                                    ?.message ||
                                    "Unable to delete message"
                                );
                              }
                            }}
                          >
                            🗑️ Delete message
                          </button>
                        )}

<button type="button" className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setOpenMenu(null); onForwardMessage?.(message); }}>↗️ Forward</button>

                        {/* Bookmark */}
                        <div className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50">
                          <span className="text-sm">
                            Bookmark
                          </span>

                          <BookmarkButton
                            messageId={
                              message._id
                            }
                          />
                        </div>

                        {/* Self destruct */}
                        <div className="mt-1 border-t px-2 py-2">
                          <p className="mb-2 text-xs text-gray-500">
                            Self-destruct
                          </p>

                          <SelfDestructSelector
                            messageId={
                              message._id
                            }
                            onUpdated={(
                              updated
                            ) => {
                              setLocalMessages(
                                (prev) =>
                                  prev.map(
                                    (item) =>
                                      String(
                                        item._id
                                      ) ===
                                      String(
                                        message._id
                                      )
                                        ? {
                                            ...item,
                                            ...updated,
                                          }
                                        : item
                                  )
                              );
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageContent({ message }) {
  const mediaUrl =
  message.mediaUrl ||
  message.fileUrl ||
  message.image ||
  message.video ||
  message.audio;

  const mediaType =
    message.mediaType ||
    message.messageType;

  if (mediaType === "poll") {
    return (
      <PollCard
        poll={
          message.poll ||
          message.pollData ||
          message.pollId
        }
        currentUserId={getCurrentUserId()}
      />
    );
  }

  /* Image */
  if (
    mediaType === "image" &&
    mediaUrl
  ) {
    return (
      <img
        src={mediaUrl}
        alt="attachment"
        className="max-h-80 max-w-full rounded-xl object-cover"
      />
    );
  }

  /* Video */
  if (
    mediaType === "video" &&
    mediaUrl
  ) {
    return (
      <video
        controls
        src={mediaUrl}
        className="max-h-80 max-w-full rounded-xl"
      />
    );
  }

  /* Audio */
  if (
    mediaType === "audio" &&
    mediaUrl
  ) {
    return (
      <audio
        controls
        src={mediaUrl}
        className="max-w-full"
      />
    );
  }

  /* Document */
  if (
    (mediaType === "document" ||
      mediaType === "file") &&
    mediaUrl
  ) {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-lg bg-black/10 p-3 underline"
      >
        <span className="text-2xl">
          📄
        </span>

        <span className="break-all">
          {message.fileName ||
            message.originalName ||
            "Open document"}
        </span>
      </a>
    );
  }

  /* Text */
      return (
        <>
          <p className="whitespace-pre-wrap break-words">
            {message.text ||
              message.content ||
              ""}
          </p>
            
          {(message.text || message.content)?.trim() && (
            <TranslationButton
              text={
                message.text ||
                message.content ||
                ""
              }
            />
          )}
        </>
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

function getExpiryText(message) {
  if (!message.expiresAt) {
    return "self-destruct";
  }

  const seconds = Math.max(
    0,
    Math.round(
      (new Date(message.expiresAt) -
        Date.now()) /
        1000
    )
  );

  return seconds > 0
    ? `${seconds}s`
    : "expired";
}

export default ChatWindow;