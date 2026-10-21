import { useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";

import {
  smartReply,
  summarize,
  explain,
  rephrase,
} from "../../../services/aiService";

function AIAssistant({
  messages,
  onUseReply,
  onClose,
}) {
  const { t } = usePreferences();

  const [mode, setMode] = useState("smart");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const latestText =
    messages?.length > 0
      ? messages[messages.length - 1]?.text ||
        messages[messages.length - 1]?.content ||
        ""
      : "";

  const runAI = async () => {
    const text =
      input.trim() || latestText;

    if (!text) {
      setError(
        "Enter or select some text first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setReplies([]);

    try {
      if (mode === "smart") {
        const data = await smartReply(text);

        setReplies(
          data.replies || []
        );
      }

      if (mode === "summarize") {
        const data = await summarize(text);

        setResult(
          data.summary || ""
        );
      }

      if (mode === "rephrase") {
        const data = await rephrase(text);

        setResult(
          data.rephrasedText || ""
        );
      }

      if (mode === "explain") {
        const data = await explain(text);

        setResult(
          data.explanation || ""
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "AI request failed. Check that the backend and API key are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-50 flex w-full min-h-0 flex-col border-l bg-white shadow-xl sm:w-[350px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-bold">
            ✨ {t("aiAssistant")}
          </h2>

          <p className="text-xs text-gray-500">
            {t("poweredByBackend")}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xl text-gray-500 hover:text-black"
          aria-label="Close AI Assistant"
        >
          ×
        </button>
      </div>

      {/* AI modes */}
      <div className="grid grid-cols-2 gap-2 border-b p-3">
        {[
          ["smart", t("smart")],
          ["summarize", t("summary")],
          ["rephrase", t("rephrase")],
          ["explain", t("explain")],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => {
              setMode(value);
              setResult("");
              setReplies([]);
              setError("");
            }}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
              mode === value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          placeholder={
            latestText
              ? `Latest message: ${latestText.slice(
                  0,
                  80
                )}`
              : "Enter text..."
          }
          className="min-h-28 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-indigo-400"
        />

        {/* Generate */}
        <button
          type="button"
          onClick={runAI}
          disabled={loading}
          className="mt-3 w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? "Working..."
            : "✨ Generate"}
        </button>

        {/* Error */}
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Smart replies */}
        {replies.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="font-semibold">
              {t("smartReplies")}
            </h3>

            {replies.map(
              (reply, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() =>
                    onUseReply(reply)
                  }
                  className="w-full rounded-xl border p-3 text-left hover:bg-indigo-50"
                >
                  {reply}
                </button>
              )
            )}
          </div>
        )}

        {/* AI result */}
        {result && (
          <div className="mt-5">
            <h3 className="mb-2 font-semibold">
              {t("aiResponse")}
            </h3>

            <div className="whitespace-pre-wrap rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm">
              {result}
            </div>

            <button
              type="button"
              onClick={() =>
                onUseReply(result)
              }
              className="mt-3 w-full rounded-lg border border-indigo-600 py-2 text-indigo-600 hover:bg-indigo-50"
            >
              Use this in message
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default AIAssistant;