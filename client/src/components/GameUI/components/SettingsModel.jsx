import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import API from "../../../api/AuthApi";
import toast from "react-hot-toast";
import PlayerAvatar from "./PlayerAvatar";

/**
 * SettingsModal
 * Full-screen modal with player info, toggles, profile editor, and a leave button.
 */
export default function SettingsModal({
  me,
  vibrationEnabled,
  musicEnabled,
  onVibrationChange,
  onMusicChange,
  onLeave,
  onClose,
  onShowInstructions,
}) {
  const { roomCode } = useParams();
  const pickerRef = useRef(null);

  const [displayName, setDisplayName] = useState(me?.name || "");
  const [emoji, setEmoji] = useState(me?.avatarEmoji || "");
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch live auth data on mount
  useEffect(() => {
    API.get("/auth/me", { _skipRefresh: true })
      .then((res) => {
        const u = res.data;
        if (u.username) setDisplayName(u.username);
        if (u.avatar_emoji) setEmoji(u.avatar_emoji);
      })
      .catch(() => {
        // Fallback for guest using localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("uno_user") || "null");
          if (stored) {
            if (stored.username) setDisplayName(stored.username);
            if (stored.avatarEmoji) setEmoji(stored.avatarEmoji);
          }
        } catch (e) {}
      });
  }, []);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      return toast.error("Name cannot be empty");
    }
    setLoading(true);
    try {
      const stored = JSON.parse(localStorage.getItem("uno_user") || "null");
      const updatedUser = {
        ...(stored || {}),
        username: displayName.trim(),
        avatarEmoji: emoji || null,
      };
      localStorage.setItem("uno_user", JSON.stringify(updatedUser));

      if (roomCode) {
        await API.patch(`/rooms/${roomCode}/profile`, {
          displayName: displayName.trim(),
          avatarEmoji: emoji || null,
        });
      } else {
        if (stored?.userId) {
          await API.patch("/auth/avatar", {
            username: displayName.trim(),
            avatarEmoji: emoji || null,
          });
        }
      }
      toast.success("Profile updated!");
      setShowPicker(false);
      
      // Auto-reload to force room players list refresh
      setTimeout(() => {
        onClose();
        if (roomCode) {
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const previewPlayer = {
    name: displayName,
    avatarEmoji: emoji,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
        bg-black/85 backdrop-blur-md p-4"
    >
      <div
        className="bg-[#120022] border border-white/20 rounded-3xl p-6
          w-full max-w-sm flex flex-col gap-5 shadow-[0_8px_32px_rgba(168,85,247,0.3)] animate-[scaleUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] relative overflow-visible"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2
            className="text-lg font-black text-white uppercase tracking-wider"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Game Settings
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-sm">
            Close
          </button>
        </div>

        {/* Profile Editor */}
        <div className="flex flex-col items-center gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setShowPicker((p) => !p)}
              className="w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-200 hover:scale-105 relative
                border border-purple-400/40 hover:border-purple-400/80"
              style={{ background: "rgba(150,80,255,0.15)" }}
            >
              {emoji ? (
                <span className="text-3xl leading-none">{emoji}</span>
              ) : (
                <span
                  className="text-lg font-black text-purple-300 leading-none"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {displayName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </button>

            {showPicker && (
              <div
                className="absolute z-[110] left-1/2 -translate-x-1/2 mt-3"
                style={{ top: "100%" }}
              >
                <div className="p-3 rounded-3xl bg-[#2a104d] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <EmojiPicker
                    theme="dark"
                    skinTonesDisabled
                    searchDisabled
                    height={300}
                    width={250}
                    onEmojiClick={(e) => {
                      setEmoji(e.emoji);
                      setShowPicker(false);
                    }}
                    style={{
                      "--epr-bg-color": "#1a0a3a",
                      "--epr-category-label-bg-color": "#1a0a3a",
                      "--epr-hover-bg-color": "rgba(150,80,255,0.2)",
                      "--epr-border-color": "rgba(150,80,255,0.2)",
                      "--epr-text-color": "rgba(255,255,255,0.7)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
              Display Name
            </span>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="Enter display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={32}
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 outline-none focus:border-purple-400/50"
              />
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-4 rounded-xl text-xs font-bold text-purple-200 border border-purple-400/30 bg-purple-600/30 hover:bg-purple-600/50 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? "Saving" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3.5 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.03]">
          <label className="flex items-center justify-between text-white text-sm font-semibold cursor-pointer">
            Vibration Haptics
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => onVibrationChange(e.target.checked)}
              className="w-4.5 h-4.5 accent-purple-500 rounded cursor-pointer"
            />
          </label>

          <div className="h-px bg-white/5" />

          <label className="flex items-center justify-between text-white text-sm font-semibold cursor-pointer">
            Music & Sounds
            <input
              type="checkbox"
              checked={musicEnabled}
              onChange={(e) => onMusicChange(e.target.checked)}
              className="w-4.5 h-4.5 accent-purple-500 rounded cursor-pointer"
            />
          </label>

          {onShowInstructions && (
            <>
              <div className="h-px bg-white/5" />
              <button
                type="button"
                onClick={onShowInstructions}
                className="w-full py-2.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 font-bold border border-purple-500/20 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                📖 How to Play Instructions
              </button>
            </>
          )}
        </div>

        {/* Leave Match */}
        {roomCode && (
          <button
            onClick={onLeave}
            className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400
              font-bold border border-red-500/20
              hover:bg-red-500/20 hover:text-red-300 transition-colors cursor-pointer"
          >
            Leave Match
          </button>
        )}
      </div>
      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
