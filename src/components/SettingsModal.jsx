import React, {
  useCallback,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import classes from "./SettingsModal.module.css";
import AvatarPicker from "./UI/AvatarPicker/AvatarPicker.jsx";
import { mediaService } from "../services/MediaService";
import UserServices from "../services/UserService.jsx";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  notifyError,
  notifySuccess,
} from "../notifications/notificationService";
import {
  ACCENT_COLORS,
  MAX_UI_SCALE,
  MIN_UI_SCALE,
  useThemeSettings,
} from "../theme";
import { useUpdater } from "../updates/UpdateProvider";
import { getErrorMessage } from "../utils/errors";
import { invoke } from "@tauri-apps/api/core";
import DescriptionEmojiPicker from "./UI/EmojiPicker/DescriptionEmojiPicker.jsx";
import EmojiButton from "./UI/EmojiButton/EmojiButton.jsx";
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from "../constants/limits.js";

const SettingsModal = function ({ onClose }) {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isDescriptionEmojiOpen, setIsDescriptionEmojiOpen] = useState(false);
  const [descriptionEmojiPosition, setDescriptionEmojiPosition] =
    useState(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [isResettingMediaPermissions, setIsResettingMediaPermissions] =
    useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const { AuthStore, MediaStore } = useContext(Context);
  const login = AuthStore.user.login || "Login";
  const displayName = AuthStore.user.username || login;
  const [activeTab, setActiveTab] = useState("App");
  const { theme, mainColor, uiScale, setThemeSettings } = useThemeSettings();
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [pendingMainColor, setPendingMainColor] = useState(mainColor);
  const [pendingUiScale, setPendingUiScale] = useState(uiScale);
  const updater = useUpdater();
  const tabs = [
    { id: "Device", label: "Устройства" },
    { id: "Profile", label: "Профиль" },
    { id: "App", label: "Внешний вид", icon: "/paintpalette.svg" },
  ];
  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const descriptionRef = useRef(null);
  const descriptionEmojiRef = useRef(null);
  const descriptionEmojiPortalRef = useRef(null);

  useLayoutEffect(() => {
    if (!isDescriptionEmojiOpen) {
      setDescriptionEmojiPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const anchor = descriptionEmojiRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const anchorTop = rect.top;
      const anchorBottom = rect.bottom;
      const anchorRight = rect.right;
      const edgeGap = 12;
      const pickerGap = 8;
      const pickerWidth = Math.min(320, viewportWidth - edgeGap * 2);
      const spaceAbove = anchorTop - edgeGap - pickerGap;
      const spaceBelow = viewportHeight - anchorBottom - edgeGap - pickerGap;
      const openAbove = spaceAbove >= spaceBelow;
      const availableHeight = Math.min(
        360,
        Math.max(0, openAbove ? spaceAbove : spaceBelow),
      );
      const left = Math.min(
        Math.max(edgeGap, anchorRight - pickerWidth),
        viewportWidth - pickerWidth - edgeGap,
      );
      const top = openAbove
        ? Math.max(edgeGap, anchorTop - availableHeight - pickerGap)
        : anchorBottom + pickerGap;

      setDescriptionEmojiPosition({
        top,
        left,
        width: pickerWidth,
        height: availableHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [isDescriptionEmojiOpen, uiScale]);

  useEffect(() => {
    if (!isDescriptionEmojiOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (descriptionEmojiRef.current?.contains(event.target)) return;
      if (descriptionEmojiPortalRef.current?.contains(event.target)) return;
      setIsDescriptionEmojiOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isDescriptionEmojiOpen]);

  const addDescriptionEmoji = useCallback((emoji) => {
    const input = descriptionRef.current;
    const selectionStart = input?.selectionStart ?? 0;
    const selectionEnd = input?.selectionEnd ?? selectionStart;
    const currentDescription = input?.value ?? "";
    const nextDescription =
      currentDescription.slice(0, selectionStart) +
      emoji +
      currentDescription.slice(selectionEnd);

    if (nextDescription.length > 450) return;
    setDescription(nextDescription);

    requestAnimationFrame(() => {
      descriptionRef.current?.focus();
      const cursorPosition = selectionStart + emoji.length;
      descriptionRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }, []);

  useEffect(() => {
    MediaStore.initializeDevices({ requestMicrophone: true });
  }, []);

  useEffect(() => {
    setPendingTheme(theme);
    setPendingMainColor(mainColor);
    setPendingUiScale(uiScale);
  }, [mainColor, theme, uiScale]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await UserServices.getProfile();
        if (!isMounted) return;
        AuthStore.setUser({
          ...AuthStore.user,
          ...response.data,
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [AuthStore]);

  useEffect(() => {
    setUsername(AuthStore.user.username || "");
    setEmail(AuthStore.user.email || "");
    setDescription(AuthStore.user.descriptions || "");
    setAvatar(null);
    setPassword("");
    setPasswordConfirm("");
    setProfileError("");
  }, [
    AuthStore.user.id,
    AuthStore.user.username,
    AuthStore.user.email,
    AuthStore.user.descriptions,
  ]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");

    if ((password || passwordConfirm) && password !== passwordConfirm) {
      setProfileError("Пароли не совпадают");
      return;
    }

    const nextUsername = username.trim();
    const nextEmail = email.trim();
    const nextDescription = description.trim();
    const formData = new FormData();

    if (nextUsername !== (AuthStore.user.username || "")) {
      formData.append("username", nextUsername);
    }

    if (nextEmail !== (AuthStore.user.email || "")) {
      formData.append("email", nextEmail);
    }

    if (nextDescription !== (AuthStore.user.descriptions || "")) {
      formData.append("descriptions", nextDescription);
    }

    if (avatar) {
      formData.append("avatar", avatar);
    }

    if (password) {
      formData.append("password", password);
      formData.append("password_confirm", passwordConfirm);
    }

    if ([...formData.keys()].length === 0) {
      notifySuccess("Профиль обновлен");
      return;
    }

    try {
      setIsSavingProfile(true);
      const response = await UserServices.updateProfile(formData);
      AuthStore.setUser({
        ...AuthStore.user,
        ...response.data,
      });
      setAvatar(null);
      setPassword("");
      setPasswordConfirm("");
      notifySuccess("Профиль обновлен");
    } catch (error) {
      const message = getErrorMessage(error, "Не удалось сохранить профиль.");
      setProfileError(message);
      notifyError(error, message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const stopMicrophoneTest = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    mediaService.stopTestMicrophone(testStreamRef.current);
    testStreamRef.current = null;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setMicLevel(0);
    setIsTestingMicrophone(false);
  };

  useEffect(() => {
    if (activeTab !== "Device" && isTestingMicrophone) {
      stopMicrophoneTest();
    }
  }, [activeTab, isTestingMicrophone]);

  useEffect(() => {
    testStreamRef.current?.__updateAudioSettings?.(
      MediaStore.getAudioSettings(),
      ["volume"],
    );
  }, [MediaStore.volume]);

  useEffect(() => {
    testStreamRef.current?.__updateAudioSettings?.(
      MediaStore.getAudioSettings(),
      ["noiseGateEnabled"],
    );
  }, [MediaStore.noiseGateEnabled]);

  useEffect(() => {
    testStreamRef.current?.__updateAudioSettings?.(
      MediaStore.getAudioSettings(),
      ["noiseGateThreshold"],
    );
  }, [MediaStore.noiseGateThreshold]);

  useEffect(() => {
    if (!isTestingMicrophone) return;

    const restartMicrophoneTest = async () => {
      await stopMicrophoneTest();
      await startMicrophoneTest();
    };

    restartMicrophoneTest();
  }, [MediaStore.autoGainControl, MediaStore.noiseSuppressionMode]);

  useEffect(
    () => () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      mediaService.stopTestMicrophone(testStreamRef.current);
      audioContextRef.current?.close();
    },
    [],
  );

  const startMicAnalyzer = async (stream) => {
    const audioContext = new AudioContext({
      sampleRate: 48000,
      latencyHint: 0,
    });
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    analyserRef.current = analyser;
    source.connect(analyser);
    source.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }

      const average = sum / dataArray.length;
      setMicLevel(average);

      animationRef.current = requestAnimationFrame(update);
    };

    update();
  };

  const startMicrophoneTest = async (
    deviceId = MediaStore.selectedMicrophone,
  ) => {
    try {
      const stream = await mediaService.testMicrophone(deviceId, {
        volume: MediaStore.volume,
        audioSettings: MediaStore.getAudioSettings(),
      });
      testStreamRef.current = stream;
      await startMicAnalyzer(stream);
      setIsTestingMicrophone(true);
    } catch (error) {
      mediaService.stopTestMicrophone(testStreamRef.current);
      testStreamRef.current = null;
      console.error("Ошибка запуска микрофона:", error);
    }
  };

  const toggleMicrophoneTest = () => {
    if (isTestingMicrophone) {
      stopMicrophoneTest();
    } else {
      startMicrophoneTest();
    }
  };

  const changeMicrophone = async (deviceId) => {
    const wasTesting = isTestingMicrophone;
    if (wasTesting) {
      await stopMicrophoneTest();
    }
    MediaStore.changeMicrophone(deviceId);
    if (wasTesting) {
      await startMicrophoneTest(deviceId);
    }
  };

  const changeSpeaker = (deviceId) => {
    MediaStore.setDisplay(deviceId);
  };

  const resetMicrophoneSettings = () => {
    MediaStore.resetAudioSettings();
    notifySuccess("Настройки микрофона сброшены");
  };

  const changeCamera = (deviceId) => {
    MediaStore.setCamera(deviceId);
  };

  const handleLogout = async () => {
    await AuthStore.logout();
    navigate("/login", { replace: true });
  };

  const saveAppearance = () => {
    setThemeSettings({
      theme: pendingTheme,
      mainColor: pendingMainColor,
      uiScale: pendingUiScale,
    });
  };

  const resetAppearance = () => {
    setPendingTheme(theme);
    setPendingMainColor(mainColor);
    setPendingUiScale(uiScale);
  };

  const hasAppearanceChanges =
    pendingTheme !== theme ||
    pendingMainColor.toLowerCase() !== mainColor.toLowerCase() ||
    Number(pendingUiScale) !== Number(uiScale);

  const requestMediaPermission = async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    mediaService.stopStream(stream);
  };

  const resetMediaPermissions = async () => {
    if (!window.__TAURI_INTERNALS__) {
      notifyError(
        null,
        "Сброс разрешений доступен только в приложении PepeChat.",
      );
      return;
    }

    try {
      setIsResettingMediaPermissions(true);
      await invoke("reset_media_permissions");

      // WebView2 applies SetPermissionState asynchronously.
      await new Promise((resolve) => setTimeout(resolve, 250));

      const results = await Promise.allSettled([
        requestMediaPermission({ audio: true }),
        requestMediaPermission({ video: true }),
      ]);
      const [microphone, camera] = results;

      await MediaStore.initializeDevices({ requestMicrophone: false });

      if (microphone.status === "fulfilled" && camera.status === "fulfilled") {
        notifySuccess("Доступ к микрофону и камере обновлён.");
      } else if (microphone.status === "fulfilled") {
        notifySuccess(
          "Доступ к микрофону обновлён. Камера недоступна или запрещена.",
        );
      } else if (camera.status === "fulfilled") {
        notifySuccess(
          "Доступ к камере обновлён. Микрофон недоступен или запрещён.",
        );
      } else {
        throw new Error(
          "Доступ не предоставлен. Проверьте настройки конфиденциальности Windows.",
        );
      }
    } catch (error) {
      console.error("Failed to reset media permissions:", error);
      notifyError(
        error,
        getErrorMessage(error, "Не удалось повторно запросить разрешения."),
      );
    } finally {
      setIsResettingMediaPermissions(false);
    }
  };

  return (
    <div className={classes.settings_modal}>
      <button
        type="button"
        onClick={onClose}
        className={classes.close}
        aria-label="Закрыть настройки"
      >
        <span aria-hidden="true">×</span>
      </button>

      <div className={classes.settings_body}>
        <nav className={classes.settings_tab} aria-label="Разделы настроек">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`${classes.tablinks} ${activeTab === tab.id ? classes.active : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon === "/paintpalette.svg" && (
                <img src={tab.icon} className={classes.tab_icon} />
              )}
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            type="button"
            className={`${classes.tablinks} ${classes.sidebar_logout}`}
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5C5 18.22 5.78 19 6.75 19H10M14.5 8l4 4-4 4M18 12H9" />
            </svg>
            <span>Выйти</span>
          </button>
        </nav>

        {activeTab === "Profile" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <div>
                <h3>Профиль</h3>
                <p>Измените личные данные и настройки безопасности</p>
              </div>
            </div>

            <form className={classes.tabcontent_body} onSubmit={saveProfile}>
              <div className={classes.profile_card}>
                <div className={classes.profile_identity}>
                  <AvatarPicker
                    avatar={avatar}
                    onSelectAvatar={setAvatar}
                    previewSrc={AuthStore.user.avatar}
                  />

                  <div className={classes.profile_summary}>
                    <span>{displayName}</span>
                    <p>@{login}</p>
                  </div>
                </div>

                <div className={classes.profile_fields}>
                  <label className={classes.control_label}>
                    Username
                    <input
                      type="text"
                      placeholder="Your username"
                      value={username}
                      maxLength={USERNAME_MAX_LENGTH}
                      onChange={(e) => setUsername(e.target.value)}
                      className={classes.settings_input}
                    />
                  </label>
                  <label className={classes.control_label}>
                    Email
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      maxLength={EMAIL_MAX_LENGTH}
                      onChange={(e) => setEmail(e.target.value)}
                      className={classes.settings_input}
                    />
                  </label>
                  <label
                    className={`${classes.control_label} ${classes.description_label}`}
                  >
                    Описание
                    <div
                      className={classes.description_input_box}
                      ref={descriptionEmojiRef}
                    >
                      {isDescriptionEmojiOpen &&
                        descriptionEmojiPosition &&
                        createPortal(
                          <div
                            ref={descriptionEmojiPortalRef}
                            className={classes.description_emoji_portal}
                            style={{
                              top: descriptionEmojiPosition.top,
                              left: descriptionEmojiPosition.left,
                              width: descriptionEmojiPosition.width,
                              height: descriptionEmojiPosition.height,
                            }}
                          >
                            <DescriptionEmojiPicker
                              className={classes.description_emoji_picker}
                              onEmojiSelect={addDescriptionEmoji}
                            />
                          </div>,
                          document.body,
                        )}
                      <input
                        type="text"
                        ref={descriptionRef}
                        placeholder="Расскажите немного о себе"
                        value={description}
                        maxLength={450}
                        rows={3}
                        onChange={(e) => setDescription(e.target.value)}
                        className={classes.settings_input}
                      />
                      <EmojiButton
                        className={classes.description_emoji_button}
                        isOpen={isDescriptionEmojiOpen}
                        onClick={() =>
                          setIsDescriptionEmojiOpen((isOpen) => !isOpen)
                        }
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className={classes.settings_section}>
                <div className={classes.section_header}>
                  <span>Безопасность</span>
                </div>

                <div className={classes.profile_fields}>
                  <label className={classes.control_label}>
                    Новый пароль
                    <input
                      type="password"
                      placeholder="Новый пароль"
                      value={password}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(e) => setPassword(e.target.value)}
                      className={classes.settings_input}
                    />
                  </label>
                  <label className={classes.control_label}>
                    Повторите пароль
                    <input
                      type="password"
                      placeholder="Повторите пароль"
                      value={passwordConfirm}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className={classes.settings_input}
                    />
                  </label>
                </div>
              </div>

              {profileError && (
                <p className={classes.profile_error}>{profileError}</p>
              )}

              <div className={classes.profile_actions}>
                <button
                  type="submit"
                  className={classes.save_btn}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "App" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <div>
                <h3>Внешний вид</h3>
                <p>Настройте оформление PepeChat под себя</p>
              </div>
            </div>

            <div
              className={`${classes.tabcontent_body} ${classes.appearance_body}`}
            >
              <section className={classes.appearance_section}>
                <div className={classes.appearance_section_header}>
                  <h4>Тема интерфейса</h4>
                  <p>Выберите светлое или тёмное оформление</p>
                </div>

                <div className={classes.theme_options}>
                  {[
                    {
                      id: "light",
                      label: "Светлая тема",
                      image: "/light-theme.svg",
                    },
                    {
                      id: "dark",
                      label: "Тёмная тема",
                      image: "/dark-theme.svg",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${classes.theme_option} ${
                        pendingTheme === option.id
                          ? classes.theme_option_active
                          : ""
                      }`}
                      onClick={() => setPendingTheme(option.id)}
                      aria-label={option.label}
                      aria-pressed={pendingTheme === option.id}
                    >
                      <img src={option.image} alt="" />
                    </button>
                  ))}
                </div>
              </section>

              <section className={classes.appearance_section}>
                <div className={classes.appearance_section_header}>
                  <h4>Акцентный цвет</h4>
                  <p>Выберите основной цвет элементов интерфейса</p>
                </div>

                <div className={classes.color_grid}>
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${classes.color_swatch} ${
                        pendingMainColor.toLowerCase() === color.toLowerCase()
                          ? classes.color_swatch_active
                          : ""
                      }`}
                      style={{ "--swatch-color": color }}
                      onClick={() => setPendingMainColor(color)}
                      aria-label={`Выбрать цвет ${color}`}
                      aria-pressed={
                        pendingMainColor.toLowerCase() === color.toLowerCase()
                      }
                    />
                  ))}

                  <label className={classes.custom_color}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3a9 9 0 0 0 0 18h1.1a2.15 2.15 0 0 0 1.48-3.71 1.6 1.6 0 0 1 1.08-2.78H17A4 4 0 0 0 21 10.5C21 6.36 16.97 3 12 3Z" />
                      <circle cx="7.7" cy="10.1" r="1.25" />
                      <circle cx="10.2" cy="6.9" r="1.25" />
                      <circle cx="14.3" cy="6.7" r="1.25" />
                    </svg>
                    <span>Свой</span>
                    <input
                      type="color"
                      value={pendingMainColor}
                      onChange={(event) =>
                        setPendingMainColor(event.target.value)
                      }
                      aria-label="Выбрать свой акцентный цвет"
                    />
                  </label>
                </div>
              </section>

              <section className={classes.appearance_section}>
                <div className={classes.appearance_section_header}>
                  <h4>Масштаб интерфейса</h4>
                  <p>Настройте удобный размер элементов</p>
                </div>

                <div className={classes.scale_control}>
                  <div className={classes.scale_presets}>
                    {[0.75, 1, 1.25, 1.5, 1.75].map((scale) => (
                      <button
                        key={scale}
                        type="button"
                        className={
                          Number(pendingUiScale) === scale
                            ? classes.scale_preset_active
                            : ""
                        }
                        onClick={() => setPendingUiScale(scale)}
                        aria-pressed={Number(pendingUiScale) === scale}
                      >
                        <span aria-hidden="true" />
                        {Math.round(scale * 100)}%
                      </button>
                    ))}
                  </div>

                  <div className={classes.scale_slider}>
                    <input
                      type="range"
                      min={MIN_UI_SCALE}
                      max={MAX_UI_SCALE}
                      step="0.25"
                      value={pendingUiScale}
                      onChange={(event) =>
                        setPendingUiScale(Number(event.target.value))
                      }
                      style={{
                        "--scale-progress": `${
                          ((Number(pendingUiScale) - MIN_UI_SCALE) /
                            (MAX_UI_SCALE - MIN_UI_SCALE)) *
                          100
                        }%`,
                      }}
                      aria-label="Масштаб интерфейса"
                    />
                  </div>
                </div>
              </section>

              <section
                className={`${classes.appearance_section} ${classes.update_section}`}
                aria-live="polite"
              >
                <div className={classes.appearance_section_header}>
                  <h4>Обновления</h4>
                  <p>
                    {updater.status === "checking" && "Проверяем обновления…"}
                    {updater.status === "upToDate" &&
                      "Установлена последняя версия"}
                    {updater.status === "available" &&
                      `Доступна версия ${updater.nextVersion}`}
                    {updater.status === "downloading" && "Загрузка обновления…"}
                    {updater.status === "installing" && "Установка обновления…"}
                    {updater.status === "installed" && "Обновление установлено"}
                    {updater.status === "error" && updater.error}
                    {updater.status === "idle" &&
                      (updater.supported
                        ? "Автоматическая проверка включена"
                        : `PepeChat${
                            updater.currentVersion
                              ? ` v${updater.currentVersion}`
                              : ""
                          } — обновления доступны в приложении`)}
                  </p>
                </div>

                <div className={classes.update_actions}>
                  {updater.status === "available" ? (
                    <button type="button" onClick={updater.installUpdate}>
                      Установить
                    </button>
                  ) : updater.status === "installed" ? (
                    <button type="button" onClick={updater.relaunch}>
                      Перезапустить
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        !updater.supported ||
                        updater.status === "checking" ||
                        updater.status === "downloading" ||
                        updater.status === "installing"
                      }
                      onClick={() => updater.checkForUpdates()}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.68M20 4v4.68h-4.68" />
                      </svg>
                      {updater.status === "error" ? "Повторить" : "Проверить"}
                    </button>
                  )}
                </div>
                {updater.status === "available" && updater.notes && (
                  <p className={classes.update_notes}>{updater.notes}</p>
                )}
              </section>
            </div>

            <div className={classes.appearance_footer}>
              {hasAppearanceChanges && (
                <button
                  type="button"
                  className={classes.cancel_button}
                  onClick={resetAppearance}
                >
                  Отменить
                  <span aria-hidden="true">×</span>
                </button>
              )}
              <button
                type="button"
                className={classes.save_appearance_button}
                onClick={saveAppearance}
              >
                Сохранить
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m5 10 3 3 7-7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {activeTab === "Device" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <div>
                <h3>Устройства</h3>
                <p>Настройте микрофон, камеру и вывод звука</p>
              </div>
              <button
                type="button"
                className={classes.reset_device_settings}
                onClick={resetMicrophoneSettings}
              >
                Сбросить настройки
              </button>
            </div>

            <div className={classes.tabcontent_body}>
              <p className={classes.settings_label}>Конфиденциальность</p>
              <div className={classes.permission_card}>
                <span>
                  <strong>Микрофон и камера</strong>
                  <small>
                    Сбросить решение WebView и снова показать системные запросы
                    доступа.
                  </small>
                </span>
                <button
                  type="button"
                  onClick={resetMediaPermissions}
                  disabled={isResettingMediaPermissions}
                >
                  {isResettingMediaPermissions
                    ? "Запрашиваем…"
                    : "Запросить заново"}
                </button>
              </div>

              <div className={classes.settings_section}>
                <div className={classes.section_header}>
                  <span>Ввод</span>
                  <button
                    onClick={toggleMicrophoneTest}
                    className={classes.devices_test}
                  >
                    {isTestingMicrophone
                      ? "Остановить тест"
                      : "Тестировать микрофон"}
                  </button>
                </div>

                <label className={classes.control_label}>
                  Микрофон
                  <select
                    value={MediaStore.selectedMicrophone || ""}
                    onChange={(e) => changeMicrophone(e.target.value)}
                    className={classes.devices_select}
                  >
                    {MediaStore.microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || "Микрофон"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={classes.control_label}>
                  Камера
                  <select
                    value={MediaStore.selectedCamera || ""}
                    onChange={(e) => changeCamera(e.target.value)}
                    className={classes.devices_select}
                  >
                    <option value="">Системная камера по умолчанию</option>
                    {MediaStore.cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || "Камера"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={classes.control_label}>
                  Вывод
                  <select
                    value={MediaStore.selectedDisplay || ""}
                    onChange={(e) => changeSpeaker(e.target.value)}
                    className={classes.devices_select}
                  >
                    <option value="">System default</option>
                    {MediaStore.speakers.map((speaker) => (
                      <option key={speaker.deviceId} value={speaker.deviceId}>
                        {speaker.label || "Output device"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={classes.slider_row}>
                  <span>Уровень громкости</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={MediaStore.volume}
                    disabled={MediaStore.autoGainControl}
                    onChange={(e) =>
                      MediaStore.changeVolume(parseFloat(e.target.value))
                    }
                  />
                  <strong>
                    {MediaStore.autoGainControl
                      ? "Авто"
                      : `${Math.round(MediaStore.volume * 100)}%`}
                  </strong>
                </label>

                <div className={classes.mic_meter}>
                  <div className={classes.mic_level}>
                    <div
                      className={classes.mic_level_bar}
                      style={{ width: `${Math.min(micLevel * 2, 100)}%` }}
                    />
                  </div>
                  <span>{isTestingMicrophone ? "Live" : "Idle"}</span>
                </div>
              </div>

              <div className={classes.settings_section}>
                <div className={classes.section_header}>
                  <span>Шумоподавление</span>
                </div>

                <div className={classes.segmented_control}>
                  {[
                    { value: "off", label: "Выкл" },
                    { value: "light", label: "WebRTC" },
                    { value: "strong", label: "RNNoise" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      className={
                        MediaStore.noiseSuppressionMode === mode.value
                          ? classes.active_segment
                          : ""
                      }
                      onClick={() =>
                        MediaStore.changeNoiseSuppressionMode(mode.value)
                      }
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <label className={classes.switch_row}>
                  <span>Шлюз шума</span>
                  <input
                    type="checkbox"
                    checked={MediaStore.noiseGateEnabled}
                    onChange={(e) =>
                      MediaStore.changeNoiseGateEnabled(e.target.checked)
                    }
                  />
                </label>

                <label className={classes.slider_row}>
                  <span>Чувствительность</span>
                  <input
                    type="range"
                    min="0.005"
                    max="0.08"
                    step="0.001"
                    value={MediaStore.noiseGateThreshold}
                    disabled={!MediaStore.noiseGateEnabled}
                    onChange={(e) =>
                      MediaStore.changeNoiseGateThreshold(
                        parseFloat(e.target.value),
                      )
                    }
                  />
                  <strong>
                    {Math.round(MediaStore.noiseGateThreshold * 1000)}
                  </strong>
                </label>

                <label className={classes.switch_row}>
                  <span>Автоусиление (AGC)</span>
                  <input
                    type="checkbox"
                    checked={MediaStore.autoGainControl}
                    onChange={(e) =>
                      MediaStore.changeAutoGainControl(e.target.checked)
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(SettingsModal);
