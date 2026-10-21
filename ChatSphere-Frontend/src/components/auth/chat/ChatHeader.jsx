import { useEffect, useRef, useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";

function ChatHeader({
  onBack,
  conversation,
  online,
  lastSeen,
  typing,
  onGroupManage,
  onSearchMessages,
  onSelectMessages,
  onVoiceCall,
  onVideoCall,
}) {
  const { t } = usePreferences();

  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const menuRef = useRef(null);

  /*
   * Close menu/search when clicking outside.
   */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false);
        setShowSearch(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  if (!conversation) {
    return (
      <header className="flex h-20 items-center border-b bg-white px-5 app-surface">
        <span className="text-gray-400">
          {t("selectConversation")}
        </span>
      </header>
    );
  }

  const currentUserId = getCurrentUserId();

  const other =
    conversation.participants?.find(
      (participant) =>
        String(participant._id) !==
        String(currentUserId)
    ) ||
    conversation.participants?.[0];

  const name = conversation.isGroup
    ? conversation.groupName
    : other?.name ||
      other?.username ||
      t("unknownUser");

  const status = typing
    ? t("Typing")
    : online
    ? t("online")
    : lastSeen
    ? formatLastSeen(lastSeen)
    : t("offline");

  const submitSearch = () => {
    const value = searchText.trim();

    onSearchMessages?.(value);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchText("");
    onSearchMessages?.("");
  };

  return (
    <header className="relative z-40 flex min-h-20 shrink-0 flex-wrap gap-y-2 py-2 items-center justify-between border-b bg-white px-4 shadow-sm app-surface md:px-5">
      {/* User / Group */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Back to conversations" className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 md:hidden">{"\u2190"}</button>
        <img
          src={
            conversation.isGroup
              ? "https://ui-avatars.com/api/?name=Group&background=6366f1&color=fff"
              : other?.profilePic ||
                "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
          }
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0">
          <h2 className="truncate font-bold text-gray-900">
            {name}
          </h2>

          <p className="flex items-center gap-1 text-xs text-gray-500">
            {(
              <span
                className={`h-2 w-2 rounded-full ${
                  online
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
            )}

            <span className="truncate">
              {status}
            </span>
          </p>
        </div>
      </div>

      {/* Actions + popup container */}
      <div
        ref={menuRef}
        className="relative flex items-center gap-1"
      >
        {/* Search */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            setShowSearch((value) => !value);
            setShowMenu(false);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
            showSearch
              ? "bg-indigo-100 text-indigo-600"
              : "hover:bg-gray-100"
          }`}
          title="Search messages"
          aria-label="Search messages"
        >
          🔍
        </button>

        {/* Voice call */}
        {(
          <button
            type="button"
            onClick={onVoiceCall}
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
            title="Voice call"
            aria-label="Voice call"
          >
            📞
          </button>
        )}
        
                {/* Video call */}
        {(
          <button
            type="button"
            onClick={onVideoCall}
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
            title="Video call"
            aria-label="Video call"
          >
            📹
          </button>
        )}

        {/* Three dots */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            setShowMenu((value) => !value);
            setShowSearch(false);
          }}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition ${
            showMenu
              ? "bg-gray-200 text-gray-900"
              : "hover:bg-gray-100"
          }`}
          title="More options"
          aria-label="More options"
        >
          ⋮
        </button>

        {/* Search popup */}
        {showSearch && (
          <div className="absolute right-0 top-12 z-50 w-[min(90vw,360px)] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl">
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitSearch();
                  }

                  if (event.key === "Escape") {
                    closeSearch();
                  }
                }}
                placeholder="Search messages..."
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="button"
                onClick={submitSearch}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Search
              </button>
            </div>

            {searchText && (
              <button
                type="button"
                onClick={closeSearch}
                className="mt-2 text-xs font-medium text-gray-500 hover:text-red-500"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Three-dot menu */}
        {showMenu && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                onSelectMessages?.();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <span>☑️</span>
              <span>Select messages</span>
            </button>

            {conversation.isGroup && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onGroupManage?.();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span>👥</span>
                <span>Manage group</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function formatLastSeen(lastSeen, t) {
  if (!lastSeen) {
    return t("offline");
  }

  const date = new Date(lastSeen);

  if (Number.isNaN(date.getTime())) {
    return t("offline");
  }

  return `Last seen ${date.toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  })}`;
}

function getCurrentUserId() {
  try {
    const token = sessionStorage.getItem("token");

    if (!token) return null;

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return (
      payload.id ||
      payload._id ||
      payload.userId
    );
  } catch {
    return null;
  }
}

export default ChatHeader;