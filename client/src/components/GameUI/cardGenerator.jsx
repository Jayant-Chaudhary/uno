import React, { useState } from "react";

// ─── Color Maps ───────────────────────────────────────────────────────────────
const COLOR_MAP = {
  red: { bg: "#b91c1c", text: "#e3261c", border: "#7f1d1d" }, // using a deeper red for the bg to match your template
  yellow: { bg: "#d97706", text: "#f5c500", border: "#b45309" },
  green: { bg: "#15803d", text: "#1d9b47", border: "#14532d" },
  blue: { bg: "#1d4ed8", text: "#0b6ebf", border: "#1e3a8a" },
  wild: { bg: "#1a1a1a", text: "#fff", border: "#000" },
};

// ─── Custom SVGs (Placeholders leaving space for your own) ────────────────────
function ActionIcon({ type, size = 1 }) {
  const s = 120 * size;
  return (
    <div
      style={{
        width: s,
        height: s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Replace these with your custom SVGs. 
        Space has been reserved perfectly in the center.
      */}
      {type === "skip" && (
        <svg
          viewBox="0 0 60 60"
          fill="none"
          className="w-full h-full drop-shadow-xl"
        >
          <circle
            cx="30"
            cy="30"
            r="24"
            stroke="white"
            strokeWidth="8"
            fill="none"
          />
          <line
            x1="14"
            y1="14"
            x2="46"
            y2="46"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {type === "reverse" && (
        <svg
          viewBox="0 0 60 60"
          fill="none"
          className="w-full h-full drop-shadow-xl"
        >
          <path
            d="M14 24 Q30 8 46 24"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <polygon points="46,14 46,34 56,24" fill="white" />
          <path
            d="M46 36 Q30 52 14 36"
            stroke="white"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <polygon points="14,26 14,46 4,36" fill="white" />
        </svg>
      )}
      {type === "draw2" && (
        <svg
          viewBox="0 0 70 70"
          fill="none"
          className="w-full h-full drop-shadow-xl"
        >
          <rect x="22" y="22" width="30" height="42" rx="4" fill="white" />
          <rect x="14" y="14" width="30" height="42" rx="4" fill="white" />
          <text
            x="29"
            y="44"
            textAnchor="middle"
            fill="#333"
            fontSize="22"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
          >
            +2
          </text>
        </svg>
      )}
    </div>
  );
}

// ─── Shared Number Logic (Shadows, Italics, 6/9 Line) ─────────────────────────
function CardNumber({ value, scale, isCenter = false }) {
  const needsUnderline = value === 6 || value === 9;
  const fontSize = isCenter ? scale * 100 : scale * 32;
  const shadow = isCenter ? scale * 5 : scale * 2;
  const underlineHeight = isCenter ? scale * 8 : scale * 3;
  

  return (
    <div className="relative flex flex-col items-center justify-center leading-none">
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          fontStyle: "italic",
          color: "white",
          transform: "scaleY(1.25)",
          textShadow: `${shadow}px ${shadow}px 0 black`,
          fontFamily: "'Arial Black', Impact, sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {needsUnderline && (
        <div
          className="absolute bg-black rounded-full"
          style={{
            bottom: isCenter ? `-${scale * 4}px` : `-${scale * 2}px`,
            left: "15%",
            width: "70%",
            height: `${underlineHeight}px`,
          }}
        />
      )}
    </div>
  );
}

// ─── Main Card Face ───────────────────────────────────────────────────────────
function CardFace({ card, width, height, chooseColor }) {
  const { color, type, value } = card;
  const col = COLOR_MAP[color] || COLOR_MAP.wild;

  // Dynamic scaling based on 400px height baseline from your template
  const scale = height / 400;

  const isNumber = type === "number";
  const isWild = type === "wild" || type === "wild_draw4";
  const isDraw4 = type === "wild_draw4";

  // Wild gradient logic
  const ovalBg = isWild
    ? "conic-gradient(from -45deg, #e3261c 0deg 90deg, #0b6ebf 90deg 180deg, #f5c500 180deg 270deg, #15803d 270deg 360deg)"
    : "";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden select-none flex"
      style={{
        width,
        height,
        padding: `${scale * 6}px`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="w-full h-full rounded-2xl flex flex-col justify-between items-center relative overflow-hidden"
        style={{ backgroundColor: col.bg, padding: `${scale * 16}px` }}
      >
        {/* Top Left Corner */}
        <div className="flex w-full flex-row justify-start z-10">
          {isNumber ? (
            <CardNumber value={value} scale={scale} />
          ) : isWild ? (
            <CardNumber value={isDraw4 ? "+4" : "W"} scale={scale} />
          ) : (
            <ActionIcon type={type} size={scale * 0.4} />
          )}
        </div>

        {/* Center Oval Structure */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="rotate-[45deg]">
            <div
              className="rounded-[50%] flex items-center justify-center relative shadow-inner"
              style={{
                width: width * 0.9,
                height: height * 0.8,
                border: `${scale * 8}px solid white`,
                background: ovalBg,
              }}
            >
              {/* Un-rotate for Inner Content */}
              <div className="-rotate-[45deg] relative flex items-center justify-center w-full h-full">
                {/* 1. Standard Numbers */}
                {isNumber && (
                  <CardNumber value={value} scale={scale} isCenter />
                )}

                {/* 2. Action Icons (Space left for custom SVGs) */}
                {!isNumber && !isWild && (
                  <ActionIcon type={type} size={scale} />
                )}

                {/* 3. Wild Draw 4 Mini Ovals */}
                {isDraw4 && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* The 4 mini ovals */}
                    {[
                      { c: "#e3261c", x: -15, y: -20 },
                      { c: "#0b6ebf", x: 15, y: -10 },
                      { c: "#15803d", x: -15, y: 10 },
                      { c: "#f5c500", x: 15, y: 20 },
                    ].map((oval, i) => (
                      <div
                        key={i}
                        className="absolute rounded-[50%] rotate-[45deg]"
                        style={{
                          width: width * 0.25,
                          height: height * 0.22,
                          backgroundColor: oval.c,
                          border: `${scale * 3}px solid white`,
                          boxShadow: `${scale * 2}px ${scale * 2}px 5px rgba(0,0,0,0.4)`,
                          transform: `translate(${oval.x * scale}px, ${oval.y * scale}px) rotate(45deg)`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right Corner (Rotated) */}
        <div className="flex w-full flex-row justify-start rotate-180 z-10">
          {isNumber ? (
            <CardNumber value={value} scale={scale} />
          ) : isWild ? (
            <CardNumber value={isDraw4 ? "+4" : "W"} scale={scale} />
          ) : (
            <ActionIcon type={type} size={scale * 0.4} />
          )}
        </div>

        {/* Chosen Color Indicator for Wilds */}
        {isWild && chooseColor && chooseColor !== "wild" && (
          <div
            className="absolute bottom-0 left-0 w-full flex justify-center items-center z-20"
            style={{
              height: `${scale * 30}px`,
              backgroundColor: COLOR_MAP[chooseColor]?.bg,
              borderTop: `${scale * 2}px solid white`,
            }}
          >
            <span
              style={{
                fontSize: `${scale * 12}px`,
                color: "white",
                fontWeight: 900,
              }}
            >
              {chooseColor.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Back ────────────────────────────────────────────────────────────────
function CardBack({ width, height }) {
  const scale = height / 400;
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden select-none flex items-center justify-center"
      style={{
        width,
        height,
        padding: `${scale * 6}px`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <div className="w-full h-full bg-[#1a1a1a] rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[45deg]">
          <div
            className="rounded-[50%] flex items-center justify-center bg-[#b91c1c]"
            style={{
              width: width * 0.9,
              height: height * 0.8,
              border: `${scale * 8}px solid white`,
            }}
          >
            <div className="-rotate-[45deg]">
              <span
                style={{
                  fontSize: `${scale * 80}px`,
                  fontWeight: 900,
                  fontStyle: "italic",
                  color: "white",
                  textShadow: `${scale * 6}px ${scale * 6}px 0 black`,
                  fontFamily: "'Arial Black', Impact, sans-serif",
                }}
              >
                UNO
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public Component ─────────────────────────────────────────────────────────
export default function UnoCard({
  card,
  width = 200,
  height = 400,
  chooseColor = null,
  faceDown = false,
  onClick,
  className = "",
  style = {},
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-transform hover:-translate-y-2 hover:scale-105 active:scale-95 ${className}`}
      style={{ display: "inline-block", ...style }}
    >
      {faceDown || !card ? (
        <CardBack width={width} height={height} />
      ) : (
        <CardFace
          card={card}
          width={width}
          height={height}
          chooseColor={chooseColor}
        />
      )}
    </div>
  );
}
