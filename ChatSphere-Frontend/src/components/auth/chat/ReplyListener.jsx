import { useEffect } from "react";

/*
  Optional helper.
  MessageInput can listen for AI-generated text without Zustand/context.
*/
export default function ReplyListener({ onReply }) {
  useEffect(() => {
    const handler = (event) => onReply?.(event.detail);
    window.addEventListener("chatsphere-use-reply", handler);

    return () =>
      window.removeEventListener("chatsphere-use-reply", handler);
  }, [onReply]);

  return null;
}
