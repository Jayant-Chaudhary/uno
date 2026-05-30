import PlayerAvatar from "./PlayerAvatar";

/**
 * SettingsModal
 * Full-screen modal with player info, toggles, and a leave button.
 *
 * Props:
 *   me                 – local player object { name, avatarEmoji }
 *   vibrationEnabled   – boolean
 *   musicEnabled       – boolean
 *   onVibrationChange  – (checked: boolean) => void
 *   onMusicChange      – (checked: boolean) => void
 *   onLeave            – () => void
 *   onClose            – () => void
 */
export default function SettingsModal({
  me,
  vibrationEnabled,
  musicEnabled,
  onVibrationChange,
  onMusicChange,
  onLeave,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center
        bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        className="bg-[#120022] border border-white/20 rounded-3xl p-6
          w-full max-w-sm flex flex-col gap-6"
      >
        {/* Player info header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <PlayerAvatar player={me} index={0} size={48} />
          <div>
            <h2 className="text-xl font-black text-white">{me?.name}</h2>
            <p className="text-sm text-white/50">Settings</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between text-white font-bold">
            Vibration
            <input
              type="checkbox"
              checked={vibrationEnabled}
              onChange={(e) => onVibrationChange(e.target.checked)}
              className="w-5 h-5 accent-purple-500"
            />
          </label>

          <label className="flex items-center justify-between text-white font-bold">
            Music / Sound
            <input
              type="checkbox"
              checked={musicEnabled}
              onChange={(e) => onMusicChange(e.target.checked)}
              className="w-5 h-5 accent-purple-500"
            />
          </label>
        </div>

        {/* Leave */}
        <button
          onClick={onLeave}
          className="mt-4 w-full py-3 rounded-xl bg-red-500/20 text-red-500
            font-bold border border-red-500/50
            hover:bg-red-500 hover:text-white transition-colors"
        >
          Leave Match
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-white/40 text-sm mt-2 text-center w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
