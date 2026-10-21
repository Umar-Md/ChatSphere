import { useState } from "react";
import { translateText } from "../../../services/translationService";
import { usePreferences } from "../../../context/AppPreferences";

const LANGUAGE_CODES = {
  english: "en",
  telugu: "te",
  hindi: "hi",
};

function TranslationButton({ text }) {
  const { language, t } = usePreferences();
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const targetLanguage = LANGUAGE_CODES[language] || "en";

  const handleTranslate = async () => {
    if (!text?.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await translateText({
        text: text.trim(),
        source: "auto",
        target: targetLanguage,
      });
      setTranslated(result);
    } catch (error) {
      console.error("Translation failed:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Translation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      {!translated ? (
        <button
          type="button"
          onClick={handleTranslate}
          disabled={loading}
          className="rounded-md border border-current/30 px-2 py-1 text-xs font-medium opacity-90 hover:bg-black/10 disabled:opacity-50"
        >
          {loading ? "Translating..." : `${t("translate")} → ${language}`}
        </button>
      ) : (
        <div className="mt-2 border-t border-current/20 pt-2">
          <p className="mb-1 text-[11px] font-medium opacity-70">
            {t("translate")} ({language})
          </p>
          <p className="whitespace-pre-wrap text-sm">{translated}</p>
          <button
            type="button"
            onClick={() => setTranslated("")}
            className="mt-1 text-xs underline opacity-70"
          >
            Show original
          </button>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default TranslationButton;
