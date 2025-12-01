import React, { useState } from "react";
import "./AvatarPicker.css";

const AvatarPicker = function ({ onSelectAvatar }) {
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onSelectAvatar(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  return (
    <label className="avatar_picker">
      <img src="/photo.svg" alt="Photo" className="avatar_picker_icon" />
      {avatarPreview ? (
        <img
          src={avatarPreview}
          alt="avatar preview"
          className="avatar_preview"
        />
      ) : (
        <div className="avatar_placeholder"></div>
      )}

      <input
        type="file"
        accept="image/*"
        className="avatar_input"
        onChange={handleAvatarChange}
      />
    </label>
  );
};

export default AvatarPicker;
