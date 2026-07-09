import React, { useContext, useState, useEffect, useRef } from "react";
import classes from "./SettingsModal.module.css";
import AvatarPicker from "../components/chat/AvatarPicker.jsx";
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
  DEFAULT_MAIN_COLOR,
  MAX_UI_SCALE,
  MIN_UI_SCALE,
  useThemeSettings,
} from "../theme";

const SettingsModal = function ({ onClose }) {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const { AuthStore, MediaStore } = useContext(Context);
  const login = AuthStore.user.login || "Login";
  const displayName = AuthStore.user.username || login;
  const [activeTab, setActiveTab] = useState("Profile");
  const { theme, mainColor, uiScale, setTheme, setMainColor, setUiScale } =
    useThemeSettings();
  const [pendingMainColor, setPendingMainColor] = useState(mainColor);
  const tabs = ["Profile", "App", "Device"];
  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    MediaStore.initializeDevices({ requestMicrophone: true });
  }, []);

  useEffect(() => {
    setPendingMainColor(mainColor);
  }, [mainColor]);

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

  const getProfileErrorMessage = (error) => {
    const data = error.response?.data;
    if (!data) return error.message || "Не удалось сохранить профиль";
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;

    const firstField = Object.keys(data)[0];
    const firstValue = data[firstField];
    if (Array.isArray(firstValue)) {
      return `${firstField}: ${firstValue[0]}`;
    }
    if (firstValue) {
      return `${firstField}: ${firstValue}`;
    }

    return "Не удалось сохранить профиль";
  };

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
      const message = getProfileErrorMessage(error);
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

    gainNodeRef.current = null;
    analyserRef.current = null;
    setMicLevel(0);
    setIsTestingMicrophone(false);
  };

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        MediaStore.volume,
        audioContextRef.current.currentTime,
      );
    }
  }, [MediaStore.volume]);

  useEffect(() => {
    if (activeTab !== "Device" && isTestingMicrophone) {
      stopMicrophoneTest();
    }
  }, [activeTab, isTestingMicrophone]);

  useEffect(() => {
    if (!isTestingMicrophone) return;

    const restartMicrophoneTest = async () => {
      await stopMicrophoneTest();
      await startMicrophoneTest();
    };

    restartMicrophoneTest();
  }, [
    MediaStore.autoGainControl,
    MediaStore.noiseSuppressionMode,
    MediaStore.noiseGateEnabled,
    MediaStore.noiseGateThreshold,
  ]);

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
    const gainNode = audioContext.createGain();
    gainNode.gain.value = Math.min(MediaStore.volume, 1);
    gainNodeRef.current = gainNode;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    analyserRef.current = analyser;
    const merger = audioContext.createChannelMerger(2);

    source.connect(gainNode);
    gainNode.connect(analyser);
    gainNode.connect(merger, 0, 0);
    gainNode.connect(merger, 0, 1);
    merger.connect(audioContext.destination);

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

  const handleLogout = async () => {
    await AuthStore.logout();
    navigate("/login", { replace: true });
  };

  const applyMainColor = () => {
    setMainColor(pendingMainColor);
  };

  return (
    <div className={classes.settings_modal}>
      <button onClick={onClose} className={classes.close}>
        <img src="/close.png" />
      </button>

      <div className={classes.settings_body}>
        <div className={classes.settings_tab}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`${classes.tablinks} ${activeTab === tab ? classes.active : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Profile" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <h3>Профиль</h3>
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
                      onChange={(e) => setEmail(e.target.value)}
                      className={classes.settings_input}
                    />
                  </label>
                  <label className={classes.control_label}>
                    Описание
                    <input
                      type="text"
                      placeholder="О вас"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={classes.settings_input}
                    />
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
                <button
                  type="button"
                  onClick={handleLogout}
                  className={classes.logout}
                >
                  Выйти
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "App" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <h3>Приложение</h3>
            </div>

            <div className={classes.tabcontent_body}>
              <p className={classes.settings_label}>Внешний вид</p>

              <div className={classes.app_settings}>
                <label className={classes.setting_row}>
                  <span>
                    <strong>Светлая тема</strong>
                  </span>

                  <input
                    className={classes.theme_switch}
                    type="checkbox"
                    checked={theme === "light"}
                    onChange={(e) =>
                      setTheme(e.target.checked ? "light" : "dark")
                    }
                  />
                </label>

                <div className={classes.setting_row}>
                  <span>
                    <strong>Основной цвет</strong>
                  </span>

                  <input
                    className={classes.color_input}
                    type="color"
                    value={pendingMainColor}
                    onChange={(e) => setPendingMainColor(e.target.value)}
                    aria-label="Main color"
                  />
                </div>

                <div className={classes.color_grid}>
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${classes.color_swatch} ${
                        pendingMainColor === color
                          ? classes.color_swatch_active
                          : ""
                      }`}
                      style={{ "--swatch-color": color }}
                      onClick={() => setPendingMainColor(color)}
                      aria-label={`Set main color ${color}`}
                    />
                  ))}

                  <button
                    type="button"
                    className={classes.reset_color}
                    onClick={() => setPendingMainColor(DEFAULT_MAIN_COLOR)}
                  >
                    Сбросить
                  </button>

                  <button
                    type="button"
                    className={classes.apply_color}
                    onClick={applyMainColor}
                    disabled={pendingMainColor === mainColor}
                  >
                    Применить
                  </button>
                </div>

                <div className={classes.setting_row}>
                  <span>
                    <strong>Масштаб интерфейса</strong>
                  </span>

                  <div className={classes.scale_control}>
                    <input
                      type="range"
                      min={MIN_UI_SCALE}
                      max={MAX_UI_SCALE}
                      step="0.05"
                      value={uiScale}
                      onChange={(e) => setUiScale(e.target.value)}
                      aria-label="Interface scale"
                    />
                    <strong>{Math.round(uiScale * 100)}%</strong>
                    <button type="button" onClick={() => setUiScale(null)}>
                      Сбросить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Device" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <h3>Устройства</h3>
            </div>

            <div className={classes.tabcontent_body}>
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
                    onChange={(e) =>
                      MediaStore.changeVolume(parseFloat(e.target.value))
                    }
                  />
                  <strong>{Math.round(MediaStore.volume * 100)}%</strong>
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
                  {["off", "light", "strong"].map((mode) => (
                    <button
                      key={mode}
                      className={
                        MediaStore.noiseSuppressionMode === mode
                          ? classes.active_segment
                          : ""
                      }
                      onClick={() =>
                        MediaStore.changeNoiseSuppressionMode(mode)
                      }
                    >
                      {mode}
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
                  <span>Auto усилитель</span>
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
