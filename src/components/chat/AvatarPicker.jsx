import React, { useState, useEffect } from "react";
import "./AvatarPicker.css";

const AvatarPicker = ({ avatar, onSelectAvatar, previewSrc = null }) => {
  const [avatarPreview, setAvatarPreview] = useState(previewSrc);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(previewSrc);
    }
  }, [avatar, previewSrc]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    onSelectAvatar(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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
        <div className="avatar_placeholder" />
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
