import { useEffect, useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";

import {
  getBookmarks,
  getScheduledMessages,
  cancelScheduledMessage,
} from "../../../services/chatService";

import {
  rescheduleMessage,
  editMessage,
} from "../../../services/messageService";

function toLocalInput(date) {
  const d = new Date(date);

  const pad = (value) =>
    String(value).padStart(2, "0");

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function getStatus(item) {
  return (
    item.scheduledStatus ||
    "pending"
  );
}

export default function ToolsPanel({
  onClose,
}) {
  const { t } = usePreferences();

  const [tab, setTab] =
    useState("bookmarks");

  const [bookmarks, setBookmarks] =
    useState([]);

  const [scheduled, setScheduled] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const load = async () => {
    setLoading(true);

    try {
      if (tab === "bookmarks") {
        setBookmarks(await getBookmarks());
      } else {
        setScheduled(
          await getScheduledMessages()
        );
      }
    } catch (error) {
      console.error(
        "Tools loading failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  // Refresh scheduled messages periodically
  useEffect(() => {
    if (tab !== "scheduled") return;

    const timer = setInterval(
      load,
      10000
    );

    return () => clearInterval(timer);
  }, [tab]);

  const cancel = async (id) => {
    try {
      await cancelScheduledMessage(id);
      await load();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to cancel scheduled message."
      );
    }
  };

  const saveReschedule = async () => {
    if (!editing?.at) return;

    const selectedTime = new Date(
      editing.at
    );

    if (selectedTime <= new Date()) {
      alert(
        "Scheduled time must be in the future."
      );
      return;
    }

    try {
      await rescheduleMessage(
        editing.id,
        selectedTime.toISOString()
      );

      setEditing(null);
      await load();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to reschedule."
      );
    }
  };

  const saveEdit = async () => {
    if (
      !editing?.id ||
      !editing.text?.trim()
    ) {
      return;
    }

    try {
      await editMessage(
        editing.id,
        editing.text.trim()
      );

      setEditing(null);
      await load();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to edit scheduled message."
      );
    }
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-50 w-full min-h-0 sm:w-[360px] bg-white border-l app-surface flex flex-col shadow-xl">
      <div className="p-4 border-b flex justify-between">
        <h2 className="font-bold">
          {t("more")}
        </h2>

        <button onClick={onClose}>
          ×
        </button>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            setTab("bookmarks")
          }
          className={`p-2 rounded-lg ${
            tab === "bookmarks"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100"
          }`}
        >
          ⭐ {t("bookmarks")}
        </button>

        <button
          onClick={() =>
            setTab("scheduled")
          }
          className={`p-2 rounded-lg ${
            tab === "scheduled"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100"
          }`}
        >
          🕐 {t("scheduled")}
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {loading && (
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        )}

        {tab === "bookmarks" &&
          bookmarks.map((item) => (
            <div
              key={item._id}
              className="border rounded-xl p-3 mb-2"
            >
              <p className="text-sm">
                {item.message?.text ||
                  "Media message"}
              </p>
            </div>
          ))}

        {tab === "scheduled" &&
          scheduled.map((item) => {
            const status =
              getStatus(item);

            return (
              <div
                key={item._id}
                className="border rounded-xl p-3 mb-3"
              >
                <p className="text-sm">
                  {item.text}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(
                    item.scheduledAt
                  ).toLocaleString()}
                </p>

                <p className="text-xs mt-2">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      status === "pending"
                        ? "text-orange-600"
                        : status === "sent"
                        ? "text-green-600"
                        : status === "failed"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() +
                      status.slice(1)}
                  </span>
                </p>

                {status === "pending" && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() =>
                        setEditing({
                          id: item._id,
                          at: toLocalInput(
                            item.scheduledAt
                          ),
                          text:
                            item.text || "",
                          mode: "reschedule",
                        })
                      }
                      className="text-indigo-600 text-sm"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() =>
                        setEditing({
                          id: item._id,
                          at: toLocalInput(
                            item.scheduledAt
                          ),
                          text:
                            item.text || "",
                          mode: "edit",
                        })
                      }
                      className="text-indigo-600 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        cancel(item._id)
                      }
                      className="text-red-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        {!loading &&
          tab === "scheduled" &&
          !scheduled.length && (
            <p className="text-sm text-gray-500">
              No scheduled messages.
            </p>
          )}
      </div>

      {editing && (
        <div className="border-t p-4">
          <h3 className="font-semibold mb-3">
            {editing.mode === "edit"
              ? "Edit scheduled message"
              : "Reschedule message"}
          </h3>

          {editing.mode === "edit" ? (
            <textarea
              value={editing.text}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  text: e.target.value,
                })
              }
              className="w-full border rounded-lg p-3"
              rows={3}
            />
          ) : (
            <input
              type="datetime-local"
              min={toLocalInput(
                new Date()
              )}
              value={editing.at}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  at: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() =>
                setEditing(null)
              }
              className="flex-1 py-2 rounded-lg bg-gray-100"
            >
              {t("cancel")}
            </button>

            <button
              onClick={
                editing.mode === "edit"
                  ? saveEdit
                  : saveReschedule
              }
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}