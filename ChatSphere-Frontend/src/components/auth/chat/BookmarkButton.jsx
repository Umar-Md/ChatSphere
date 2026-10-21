import { useEffect, useState } from "react";

import {
  addBookmark,
  removeBookmark,
  checkBookmark,
} from "../../../services/bookmarkService";

function BookmarkButton({
  messageId,
}) {
  const [bookmarked, setBookmarked] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadStatus();
  }, [messageId]);

  const loadStatus = async () => {
    try {
      const response =
        await checkBookmark(messageId);

      const value =
        response?.data?.isBookmarked ??
        response?.data?.bookmarked ??
        response?.isBookmarked ??
        response?.bookmarked ??
        false;

      setBookmarked(Boolean(value));
    } catch (error) {
      console.error(
        "Bookmark status error:",
        error
      );
    }
  };

  const toggleBookmark = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (bookmarked) {
        await removeBookmark(
          messageId
        );

        setBookmarked(false);
      } else {
        await addBookmark(
          messageId
        );

        setBookmarked(true);
      }
    } catch (error) {
      console.error(
        "Bookmark error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Bookmark operation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className="text-lg hover:scale-110 transition disabled:opacity-50"
      title={
        bookmarked
          ? "Remove bookmark"
          : "Bookmark message"
      }
    >
      {bookmarked ? "⭐" : "☆"}
    </button>
  );
}

export default BookmarkButton;