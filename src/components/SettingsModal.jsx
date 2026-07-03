import React, { useContext, useState, useEffect, useRef } from "react";
import classes from "./SettingsModal.module.css";
import AvatarPicker from "../components/chat/AvatarPicker.jsx";
import { mediaService } from "../services/MediaService";
import { Context } from "../main";
import { observer } from "mobx-react-lite";
import {
  ACCENT_COLORS,
  DEFAULT_MAIN_COLOR,
  useThemeSettings,
} from "../theme";

const SettingsModal = function ({ onClose }) {
  const [avatar, setAvatar] = useState(null);
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const { AuthStore, MediaStore } = useContext(Context);
  const login = AuthStore.user.login || "Login";
  const [activeTab, setActiveTab] = useState("Profile");
  const { theme, mainColor, setTheme, setMainColor } = useThemeSettings();
  const tabs = ["Profile", "App", "Device"];
  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    MediaStore.loadDevices();
    MediaStore.loadSavedDevices();
  }, []);

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

  useEffect(() => () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    mediaService.stopTestMicrophone(testStreamRef.current);
    audioContextRef.current?.close();
  }, []);

  const startMicAnalyzer = async (stream) => {
    const audioContext = new AudioContext({
      sampleRate: 48000,
      latencyHint: 0,
    });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/rnnoise-processor.js");

    const source = audioContext.createMediaStreamSource(stream);

    const rnnoiseNode = new AudioWorkletNode(audioContext, "rnnoise-processor");

    const highpass = audioContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 80;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = MediaStore.volume;
    gainNodeRef.current = gainNode;

    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 8000;

    const compressor = audioContext.createDynamicsCompressor();

    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    analyserRef.current = analyser;

    const merger = audioContext.createChannelMerger(2);

    source.connect(rnnoiseNode);

    rnnoiseNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(gainNode);
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

  const startMicrophoneTest = async () => {
    try {
      const stream = await mediaService.testMicrophone(
        MediaStore.selectedMicrophone,
      );
      testStreamRef.current = stream;
      await startMicAnalyzer(stream);
      setIsTestingMicrophone(true);
    } catch (error) {
      mediaService.stopTestMicrophone(testStreamRef.current);
      testStreamRef.current = null;
      console.error("Failed to start microphone test:", error);
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
      await startMicrophoneTest();
    }
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
              <h3>Profile</h3>
            </div>

            <div className={classes.tabcontent_body}>
              <p className={classes.settings_label}>Profile Editing</p>

              <div className={classes.settings_box}>
                <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />

                <div className={classes.settings_field}>
                  <label>@{login}</label>
                  <input
                    type="text"
                    placeholder="Your username"
                    className={classes.settings_input}
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    className={classes.settings_input}
                  />
                </div>
              </div>

              <p className={classes.settings_label}>Change password</p>
              <div className={classes.settings_field}>
                <input
                  type="password"
                  placeholder="New password"
                  className={classes.settings_input}
                />
                <input
                  type="password"
                  placeholder="Repeat password"
                  className={classes.settings_input}
                />
              </div>

              <button
                onClick={() => AuthStore.logout()}
                className={classes.logout}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {activeTab === "App" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <h3>App</h3>
            </div>

            <div className={classes.tabcontent_body}>
              <p className={classes.settings_label}>Appearance</p>

              <div className={classes.app_settings}>
                <label className={classes.setting_row}>
                  <span>
                    <strong>Light theme</strong>
                    <small>Use bright surfaces and dark text</small>
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
                    <strong>Main color</strong>
                    <small>Accent color for buttons and active states</small>
                  </span>

                  <input
                    className={classes.color_input}
                    type="color"
                    value={mainColor}
                    onChange={(e) => setMainColor(e.target.value)}
                    aria-label="Main color"
                  />
                </div>

                <div className={classes.color_grid}>
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`${classes.color_swatch} ${
                        mainColor === color ? classes.color_swatch_active : ""
                      }`}
                      style={{ "--swatch-color": color }}
                      onClick={() => setMainColor(color)}
                      aria-label={`Set main color ${color}`}
                    />
                  ))}

                  <button
                    type="button"
                    className={classes.reset_color}
                    onClick={() => setMainColor(DEFAULT_MAIN_COLOR)}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Device" && (
          <div className={classes.tabcontent}>
            <div className={classes.tabcontent_header}>
              <h3>Devices</h3>
            </div>

            <div className={classes.tabcontent_body}>
              <select
                value={MediaStore.selectedMicrophone || ""}
                onChange={(e) => changeMicrophone(e.target.value)}
                className={classes.devices_select}
              >
                {MediaStore.microphones.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || "Microphone"}
                  </option>
                ))}
              </select>

              <label className={classes.volume}>
                Volume
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
              </label>

              <div className={classes.mic_level}>
                <div
                  className={classes.mic_level_bar}
                  style={{ width: `${Math.min(micLevel * 2, 100)}%` }}
                />
              </div>

              <button
                onClick={toggleMicrophoneTest}
                className={classes.devices_test}
              >
                {isTestingMicrophone ? "Stop test" : "Test microphone"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(SettingsModal);
