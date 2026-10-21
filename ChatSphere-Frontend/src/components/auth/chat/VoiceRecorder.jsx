import { useEffect, useRef, useState } from "react";

function VoiceRecorder({ onRecordingComplete }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    let timer;

    if (recording) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(
          chunksRef.current,
          { type: "audio/webm" }
        );

        const file = new File(
          [blob],
          `voice-${Date.now()}.webm`,
          {
            type: "audio/webm",
          }
        );

        onRecordingComplete(file);

        stream
          .getTracks()
          .forEach((track) => track.stop());
      };

      recorder.start();

      setSeconds(0);
      setRecording(true);

    } catch (error) {
      console.error(error);
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      onClick={
        recording
          ? stopRecording
          : startRecording
      }
      className={`px-3 py-2 rounded-lg ${
        recording
          ? "bg-red-500 text-white"
          : "bg-gray-200"
      }`}
    >
      {recording
        ? `⏹ ${seconds}s`
        : "🎤"}
    </button>
  );
}

export default VoiceRecorder;