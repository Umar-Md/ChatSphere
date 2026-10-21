import { useState } from "react";
import api from "../../../services/api";

const DURATIONS = [
  {
    value: 30,
    label: "30 seconds",
  },
  {
    value: 60,
    label: "1 minute",
  },
  {
    value: 300,
    label: "5 minutes",
  },
  {
    value: 3600,
    label: "1 hour",
  },
  {
    value: 86400,
    label: "24 hours",
  },
];

function SelfDestructSelector({
  messageId,
  onUpdated,
}) {
  const [duration, setDuration] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = async (event) => {
    const value = event.target.value;

    setDuration(value);

    if (!value || !messageId) {
      return;
    }

    try {
      setLoading(true);

      const response = await api.put(
        `/messages/self-destruct/${messageId}`,
        {
          expiresIn: Number(value),
        }
      );

      const updated =
        response.data?.data || response.data;

      onUpdated?.({
        ...updated,
        expiresAt: updated.expiresAt,
        isSelfDestruct:
          updated.isSelfDestruct,
      });
    } catch (error) {
      console.error(
        "Self-destruct error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to enable self-destruct."
      );

      setDuration("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={duration}
      onChange={handleChange}
      disabled={loading}
      className="border rounded-lg px-2 py-1 text-sm bg-white"
      title="Self-destruct timer"
    >
      <option value="">
        💣 Self-destruct
      </option>

      {DURATIONS.map((item) => (
        <option
          key={item.value}
          value={item.value}
        >
          {item.label}
        </option>
      ))}
    </select>
  );
}

export default SelfDestructSelector;