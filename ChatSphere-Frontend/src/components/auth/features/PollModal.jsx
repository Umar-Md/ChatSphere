import { useState } from "react";
import { usePreferences } from "../../../context/AppPreferences";
import { createPoll } from "../../../services/chatService";

function PollModal({ conversationId, onClose, onCreated }) {
  const { t } = usePreferences();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  const updateOption = (index, value) => {
    setOptions((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const clean = options.map((x) => x.trim()).filter(Boolean);

    if (!question.trim() || clean.length < 2) {
      alert("Question and at least 2 options are required.");
      return;
    }

    setLoading(true);

    try {
      const poll = await createPoll({
        conversationId,
        question: question.trim(),
        options: clean,
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : null,
      });

      onCreated?.(poll);
      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Poll" onClose={onClose}>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t("askQuestion")}
        className="w-full border rounded-lg p-3 mb-3"
      />

      {options.map((option, index) => (
        <div className="flex gap-2 mb-2" key={index}>
          <input
            value={option}
            onChange={(e) => updateOption(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="flex-1 border rounded-lg p-2"
          />
          {options.length > 2 && (
            <button
              onClick={() => removeOption(index)}
              className="px-3 text-red-500"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addOption}
        className="text-indigo-600 text-sm mb-4"
      >
        + Add option
      </button>

      <label className="block text-sm font-medium mb-1">
        Expiration (optional)
      </label>
      <input
        type="datetime-local"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        className="w-full border rounded-lg p-2 mb-4"
      />

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg"
      >
        {loading ? t("creating") : t("createPoll")}
      </button>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-xl">{title}</h2>
          <button onClick={onClose} className="text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default PollModal;
