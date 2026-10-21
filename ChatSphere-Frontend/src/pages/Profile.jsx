import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} from "../services/profileService";
import { usePreferences } from "../context/AppPreferences";

function Profile() {
  const { t } = usePreferences();

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef(null);

  const [user, setUser] = useState({
    name: "",
    email: "",
    profilePic: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();

      setUser({
        name: data.user.name || "",
        email: data.user.email || "",
        profilePic: data.user.profilePic || "",
      });
    } catch (error) {
      console.error("Profile loading failed:", error);
      alert(
        error.response?.data?.message ||
          "Failed to load profile"
      );
    }
  };

  const handleChange = (e) => {
    setUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Profile picture must not exceed 10 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const response = await uploadProfilePicture(file);

      if (response.user?.profilePic) {
        setUser((prev) => ({
          ...prev,
          profilePic: response.user.profilePic,
        }));
      }

      alert(
        response.message ||
          "Profile picture updated successfully"
      );
    } catch (error) {
      console.error(
        "Profile picture upload failed:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to upload profile picture"
      );
    } finally {
      setUploading(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await updateProfile({
        name: user.name,
        profilePic: user.profilePic,
      });

      alert(
        response.message ||
          "Profile updated successfully"
      );

      setIsEditing(false);

      await fetchProfile();
    } catch (error) {
      console.error("Profile update failed:", error);

      alert(
        error.response?.data?.message ||
          "Profile update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-4 sm:p-8">

      <div className="flex flex-col items-center">

        <img
          src={
            user.profilePic ||
            "https://i.pravatar.cc/150"
          }
          alt="Profile"
          className="w-36 h-36 rounded-full border-4 border-indigo-600 object-cover"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handlePhotoChange}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "Change Photo"}
        </button>

      </div>

      <div className="mt-8">

        <label>Name</label>

        <input
          type="text"
          name="name"
          value={user.name}
          disabled={!isEditing}
          onChange={handleChange}
          className="border p-3 w-full rounded mt-2"
        />

      </div>

      <div className="mt-6">

        <label>Email</label>

        <input
          type="email"
          value={user.email}
          disabled
          className="border p-3 w-full rounded mt-2 bg-gray-100"
        />

      </div>

      <div className="mt-8 flex flex-wrap gap-4">

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded"
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => {
                setIsEditing(false);
                fetchProfile();
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded"
            >
              Cancel
            </button>
          </>
        )}

      </div>

    </div>
  );
}

export default Profile;