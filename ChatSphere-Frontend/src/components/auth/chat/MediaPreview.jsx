import { useEffect, useState } from "react";

function MediaPreview({
  file,
  onRemove,
}) {
  const [previewUrl, setPreviewUrl] =
    useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url =
      URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file) {
    return null;
  }

  const isImage =
    file.type.startsWith("image/");

  const isVideo =
    file.type.startsWith("video/");

  const isAudio =
    file.type.startsWith("audio/");

  const isDocument =
    !isImage &&
    !isVideo &&
    !isAudio;

  const sizeMB = (
    file.size /
    1024 /
    1024
  ).toFixed(2);

  return (
    <div className="p-3 border-t bg-gray-50">

      <div className="flex items-start justify-between gap-4">

        <div className="flex-1 min-w-0">

          {isImage && (
            <img
              src={previewUrl}
              alt="Selected media preview"
              className="max-w-full max-h-64 rounded-lg object-contain"
            />
          )}

          {isVideo && (
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-64 rounded-lg"
            />
          )}

          {isAudio && (
            <audio
              src={previewUrl}
              controls
              className="w-full"
            />
          )}

          {isDocument && (
            <div className="flex items-center gap-3 p-4 bg-white border rounded-lg">

              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                📄
              </div>

              <div className="min-w-0">
                <p className="font-medium truncate">
                  {file.name}
                </p>

                <p className="text-sm text-gray-500">
                  {file.type || "Document"}
                </p>
              </div>

            </div>
          )}

          <div className="mt-2">

            <p className="font-medium truncate">
              {file.name}
            </p>

            <p className="text-sm text-gray-500">
              {sizeMB} MB
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 font-bold hover:text-red-700"
          title="Remove file"
        >
          ✕
        </button>

      </div>

    </div>
  );
}

export default MediaPreview;