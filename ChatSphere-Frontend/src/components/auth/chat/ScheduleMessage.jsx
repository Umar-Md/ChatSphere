import { useState } from "react";
import api from "../../../services/api";

function ScheduleMessage({
  conversationId,
  message,
  onScheduled,
  onClose,
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time) {
      alert("Please select date and time.");
      return;
    }

    const scheduledAt = new Date(
      `${date}T${time}`
    ).toISOString();

    try {
      setLoading(true);

      const response = await api.post(
        "/messages/schedule",
        {
          conversationId,
          text: message,
          scheduledAt,
        }
      );

      alert("Message scheduled successfully.");

      if (onScheduled) {
        onScheduled(response.data);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(
        "Schedule message error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to schedule message."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">
            📅 Schedule Message
          </h2>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xl text-gray-500"
            >
              ×
            </button>
          )}
        </div>

        <div className="bg-gray-50 border rounded-lg p-3 mb-5 text-sm">
          {message || "No message selected"}
        </div>

        <label className="block font-semibold mb-2">
          Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border rounded-lg p-3 mb-4"
        />

        <label className="block font-semibold mb-2">
          Time
        </label>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        <button
          onClick={handleSchedule}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          {loading
            ? "Scheduling..."
            : "Schedule Message"}
        </button>
      </div>
    </div>
  );
}

export default ScheduleMessage;