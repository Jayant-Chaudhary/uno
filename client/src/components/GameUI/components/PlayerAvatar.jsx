import { AVATAR_BG, AVATAR_FG } from "./constants/gameConstants";

export default function PlayerAvatar({ player, index, size = 36 }) {
  if (player?.avatarEmoji) {
    return (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: AVATAR_BG[index % 8],
          fontSize: size * 0.5,
        }}
      >
        {player.avatarEmoji}
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-bold"
      style={{
        width: size,
        height: size,
        background: AVATAR_BG[index % 8],
        color: AVATAR_FG[index % 8],
        fontSize: size * 0.35,
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {(player?.name || "?")[0].toUpperCase()}
    </div>
  );
}
