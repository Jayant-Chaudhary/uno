import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import SettingsModal from "../components/GameUI/components/SettingsModel";

export const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [musicEnabled, setMusicEnabledState] = useState(() => {
    return localStorage.getItem("musicEnabled") !== "false";
  });

  const [vibrationEnabled, setVibrationEnabledState] = useState(() => {
    return localStorage.getItem("vibrationEnabled") !== "false";
  });

  const [showSettings, setShowSettings] = useState(false);
  const bgmRef = useRef(null);
  const audioStartedRef = useRef(false);

  // Persistence
  const setMusicEnabled = (enabled) => {
    setMusicEnabledState(enabled);
    localStorage.setItem("musicEnabled", String(enabled));
  };

  const setVibrationEnabled = (enabled) => {
    setVibrationEnabledState(enabled);
    localStorage.setItem("vibrationEnabled", String(enabled));
  };

  // Haptic feedback trigger
  const triggerHaptic = useCallback((pattern = 50) => {
    if (vibrationEnabled && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn("Haptic feedback error:", err);
      }
    }
  }, [vibrationEnabled]);

  // Audio trigger
  const playSound = useCallback((path, volume = 0.7) => {
    if (!musicEnabled) return;
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch((err) => console.log("Sound play blocked:", err));
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }, [musicEnabled]);

  // Sound triggers
  const playTap = useCallback(() => {
    playSound("/sounds/tapSound.mp3", 0.6);
    triggerHaptic(30);
  }, [playSound, triggerHaptic]);

  const playUno = useCallback(() => {
    playSound("/sounds/uno.mp3", 0.9);
    triggerHaptic([100, 50, 100, 50, 300]);
  }, [playSound, triggerHaptic]);

  const playTurn = useCallback(() => {
    playSound("/sounds/turnSound.mp3", 0.8);
    triggerHaptic([150, 80, 150]);
  }, [playSound, triggerHaptic]);

  // BGM playing management
  const startBgm = useCallback(() => {
    if (!musicEnabled) return;
    if (bgmRef.current) {
      bgmRef.current.play().catch((e) => console.log("BGM play blocked:", e));
      return;
    }
    try {
      const audio = new Audio("/sounds/bgm.mp3");
      audio.loop = true;
      audio.volume = 0.25;
      bgmRef.current = audio;
      audio.play().catch((e) => console.log("BGM play blocked:", e));
    } catch (err) {
      console.warn("BGM creation error:", err);
    }
  }, [musicEnabled]);

  const stopBgm = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  }, []);

  // Update BGM state when toggle changes
  useEffect(() => {
    if (musicEnabled) {
      if (audioStartedRef.current) {
        startBgm();
      }
    } else {
      stopBgm();
    }
  }, [musicEnabled, startBgm, stopBgm]);

  // Autoplay handler on first click interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioStartedRef.current) {
        audioStartedRef.current = true;
        if (musicEnabled) {
          startBgm();
        }
      }
    };
    document.addEventListener("click", handleFirstInteraction, { once: true });
    return () => document.removeEventListener("click", handleFirstInteraction);
  }, [musicEnabled, startBgm]);

  // Global click tap sound listener
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const target = e.target.closest("button, a, [role='button'], .cursor-pointer, input[type='submit'], input[type='checkbox']");
      if (target) {
        // debounce slightly or filter standard toggles to prevent double sounds
        playTap();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [playTap]);

  // Safe parse me details
  const getMe = () => {
    try {
      const user = JSON.parse(localStorage.getItem("uno_user") || "null");
      if (user) {
        return {
          name: user.username || user.guestName || "Player",
          avatarEmoji: user.avatarEmoji || "🦊",
        };
      }
    } catch (e) {
      console.error(e);
    }
    return { name: "Player", avatarEmoji: "🦊" };
  };

  const handleGlobalLeave = () => {
    setShowSettings(false);
    // Simple redirect cleans up all game/lobby connections safely
    localStorage.removeItem("uno_user");
    window.location.href = "/";
  };

  return (
    <SettingsContext.Provider
      value={{
        musicEnabled,
        setMusicEnabled,
        vibrationEnabled,
        setVibrationEnabled,
        showSettings,
        setShowSettings,
        triggerHaptic,
        playTap,
        playUno,
        playTurn,
        startBgm,
        stopBgm,
      }}
    >
      {children}
      {showSettings && (
        <SettingsModal
          me={getMe()}
          vibrationEnabled={vibrationEnabled}
          musicEnabled={musicEnabled}
          onVibrationChange={setVibrationEnabled}
          onMusicChange={setMusicEnabled}
          onLeave={handleGlobalLeave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </SettingsContext.Provider>
  );
};
