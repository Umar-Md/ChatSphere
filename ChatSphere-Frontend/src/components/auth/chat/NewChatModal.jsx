import {
  useEffect,
  useRef,
  useState,
} from "react";

import { searchUsers } from "../../../services/profileService";
import { usePreferences } from "../../../context/AppPreferences";

function NewChatModal({
  onClose,
  onConversationCreated,
}) {
  const { t } = usePreferences();

  const [query, setQuery] =
    useState("");

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [starting, setStarting] =
    useState(null);

  const modalRef = useRef(null);

  /*
   * Search users
   */
  useEffect(() => {
    const value =
      query.trim();

    if (value.length < 2) {
      setUsers([]);
      setLoading(false);
      return undefined;
    }

    const timer =
      setTimeout(async () => {
        setLoading(true);

        try {
          const results =
            await searchUsers(
              value
            );

          setUsers(
            Array.isArray(results)
              ? results
              : []
          );
        } catch (error) {
          console.error(
            "User search failed",
            error
          );

          setUsers([]);
        } finally {
          setLoading(false);
        }
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [query]);

  /*
   * Close modal when clicking
   * outside the white card.
   */
  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(
            event.target
          )
        ) {
          onClose();
        }
      };

    /*
     * Delay listener registration
     * so the click that opens the modal
     * doesn't immediately close it.
     */
    const timer =
      setTimeout(() => {
        document.addEventListener(
          "mousedown",
          handleOutsideClick
        );
      }, 0);

    return () => {
      clearTimeout(timer);

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [onClose]);

  /*
   * Start chat
   */
  const startChat = async (
    user
  ) => {
    setStarting(user._id);

    try {
      await onConversationCreated(
        user
      );

      onClose();
    } catch (error) {
      console.error(
        "Failed to start chat",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Failed to start chat"
      );
    } finally {
      setStarting(null);
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-[2px]
      "
    >
      {/* Modal card */}
      <div
        ref={modalRef}
        className="
          relative
          z-10
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-gray-300
          bg-white
          shadow-[0_25px_80px_rgba(0,0,0,0.45)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("newChatTitle")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search for a user to start a
              conversation
            </p>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-2xl
              font-medium
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-900
            "
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="bg-gray-50 p-6">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">
              🔍
            </span>

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder={t(
                "searchUsers"
              )}
              className="
                w-full
                rounded-xl
                border
                border-gray-300
                bg-white
                py-3.5
                pl-11
                pr-4
                text-gray-900
                shadow-sm
                outline-none
                transition
                placeholder:text-gray-400
                focus:border-indigo-500
                focus:ring-4
                focus:ring-indigo-100
              "
            />
          </div>

          {/* Results */}
          <div className="mt-4 max-h-80 overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />

                <p className="text-sm font-medium text-gray-600">
                  {t("searching")}
                </p>
              </div>
            )}

            {/* No users */}
            {!loading &&
              query.trim()
                .length >= 2 &&
              users.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                  <div className="mb-2 text-3xl">
                    👤
                  </div>

                  <p className="font-medium text-gray-700">
                    {t("noUsers")}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Try another username
                    or email.
                  </p>
                </div>
              )}

            {/* Initial state */}
            {!loading &&
              query.trim()
                .length < 2 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
                  <div className="mb-2 text-3xl">
                    🔎
                  </div>

                  <p className="font-medium text-gray-700">
                    Search for a user
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter at least 2
                    characters.
                  </p>
                </div>
              )}

            {/* User results */}
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() =>
                    startChat(user)
                  }
                  disabled={
                    starting ===
                    user._id
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-3
                    text-left
                    shadow-sm
                    transition
                    hover:border-indigo-300
                    hover:bg-indigo-50
                    hover:shadow-md
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <img
                    src={
                      user.profilePic ||
                      "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
                    }
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />

                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-gray-900">
                      {user.name ||
                        user.username ||
                        "User"}
                    </strong>

                    <small className="block truncate text-gray-500">
                      {user.email || ""}
                    </small>
                  </span>

                  <span className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600">
                    {starting ===
                    user._id
                      ? "Starting..."
                      : t(
                          "startChat"
                        )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewChatModal;