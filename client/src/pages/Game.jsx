import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Hook
import { useGameLogic } from "../components/GameUI/components/hooks/Gamelogics";

// Shared / background
import AnimatedBackground from "../components/GameUI/AnimateBackground";
import UnoCard from "../components/GameUI/cardGenerator";

// Overlays
import WildColorPicker from "../components/GameUI/components/WildColorPicker";
import GameOverOverlay from "../components/GameUI/components/GameOverOverlay";
import SettingsModal from "../components/GameUI/components/SettingsModel";
import { OpponentAwayOverlay } from "../components/GameUI/components/OpponentAwayOverlay";
import UnoOverlay from "../components/GameUI/components/UnoOverlay";

// Layout pieces
import TopBar from "../components/GameUI/components/TopBar";
import OpponentGrid from "../components/GameUI/components/OpponentGrid";
import DiscardSection from "../components/GameUI/components/DiscardSection";
import HandSection from "../components/GameUI/components/HandsSection";
import NotesPanel from "../components/GameUI/components/NotesPannel";

import ActionButton from "../components/GameUI/components/ActionButton";

// ─────────────────────────────────────────────────────────────────────────────import { useParams } from "react-router-dom";

export default function Game() {
  const { roomCode } = useParams();

  const {
    // identity
    myId,
    // state
    gameState,
    selectedCard,
    setSelectedCard,
    showWildPicker,
    setShowWildPicker,
    pendingWildCard,
    setPendingWildCard,
    gameOver,
    showSettings,
    setShowSettings,
    vibrationEnabled,
    setVibrationEnabled,
    musicEnabled,
    setMusicEnabled,
    mobileTab,
    setMobileTab,
    isHandExpanded,
    setIsHandExpanded,
    opponentPage,
    setOpponentPage,
    handPage,
    setHandPage,
    notes,
    setNotes,
    noteInput,
    setNoteInput,
    // derived
    me,
    opponents,
    isMyTurn,
    topDiscard,
    currentPlayerName,
    latestGameEvent,
    isHost,
    handPages,
    oppPages,
    peek,
    gameStateVerified,
    // functions
    isValidPlay,
    handleCardTap,
    handlePlayCard,
    handleWildColorPick,
    handleDrawCard,
    handlePassTurn,
    handleSayUno,
    handleCallOut,
    handlePlayAgain,
    handlePeek,
    handleAddNote,
    handleDeleteNote,

    // action button
    normalActionLabel,
    normalActionBg,
    normalActionHandler,
    normalActionDisabled,
    unoActionLabel,
    unoActionBg,
    unoActionHandler,
    unoActionDisabled,
    showUnoAction,
    hasPlayableCard,
    secondsLeft,
    opponentAway,
    handleLeave,
    unoCallInfo,
    setUnoCallInfo,
    orderedHand,
    recentNewCardIds,
  } = useGameLogic(roomCode);

  const [showInstructions, setShowInstructions] = useState(() => {
    return localStorage.getItem("uno_instructions_seen") !== "true";
  });

  useEffect(() => {
    if (localStorage.getItem("uno_instructions_seen") !== "true") {
      localStorage.setItem("uno_instructions_seen", "true");
    }
  }, []);

  const handleCloseInstructions = () => {
    setShowInstructions(false);
  };

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (!gameState && !gameStateVerified) {
    return (
      <div className="absolute top-0 left-0 h-[100dvh] w-full">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="flex gap-1.5">
            {[0, 0.15, 0.3].map((d, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400/50"
                style={{ animation: `pulse 1.4s ease-in-out ${d}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="absolute top-0 left-0 h-[100dvh] w-full overflow-hidden">
      <AnimatedBackground />

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      {showWildPicker && (
        <WildColorPicker
          onPick={handleWildColorPick}
          onCancel={() => {
            setShowWildPicker(false);
            setPendingWildCard(null);
            setSelectedCard(null);
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          me={me}
          vibrationEnabled={vibrationEnabled}
          musicEnabled={musicEnabled}
          onVibrationChange={setVibrationEnabled}
          onMusicChange={setMusicEnabled}
          onLeave={handleLeave}
          onClose={() => setShowSettings(false)}
          onShowInstructions={() => {
            setShowInstructions(true);
            setShowSettings(false);
          }}
        />
      )}

      {unoCallInfo && (
        <UnoOverlay
          playerName={unoCallInfo.playerName}
          onClose={() => setUnoCallInfo(null)}
        />
      )}

      {gameOver && (
        <GameOverOverlay
          winner={gameOver}
          isMe={gameOver.id === myId}
          isHost={isHost}
          onPlayAgain={handlePlayAgain}
        />
      )}


      {showInstructions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#120022] border border-white/20 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-[0_8px_32px_rgba(168,85,247,0.4)] relative animate-[scaleUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            <button
              onClick={handleCloseInstructions}
              className="absolute top-4 right-4 text-white/40 hover:text-white text-lg font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-wider text-center" style={{ fontFamily: "'Syne', sans-serif" }}>
              How to Play Uno
            </h2>
            <div className="flex flex-col gap-2.5 text-xs text-white/70 leading-relaxed">
              <p>🎯 <strong>Objective</strong>: Be the first to empty your hand of cards.</p>
              <p>🃏 <strong>Matching</strong>: Play a card matching the active color, number, or type.</p>
              <p>🎨 <strong>Wild Cards</strong>: Wild and Wild Draw 4 cards can match any card, letting you pick a new active color.</p>
              <p>📢 <strong>Say UNO</strong>: Click "UNO!" when you have exactly 1 card left, or get caught and draw 2 penalty cards!</p>
              <p>⏰ <strong>Turn Timers</strong>: Play your card before the 30s timer runs out, or suffer a 1-card AFK penalty.</p>
            </div>
            <button
              onClick={handleCloseInstructions}
              className="w-full py-2.5 mt-2 rounded-xl bg-purple-600/50 hover:bg-purple-600/70 border border-purple-400/30 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer"
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE layout  — visible below lg (1024 px)
          Tablet (768-1023 px) uses this layout too, which avoids the
          compressed 3-column desktop view at mid-widths.
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col h-full lg:hidden p-2">
        {/* Top bar */}
        <TopBar
          me={me}
          isMyTurn={isMyTurn}
          currentPlayerName={currentPlayerName}
          onOpenSettings={() => setShowSettings(true)}
          secondsLeft={secondsLeft}
        />

        {/* Middle stage */}
        <div
          className={`flex-1 flex flex-col min-h-0 transition-all duration-500 backdrop-blur-2xl rounded-3xl p-3 border
            ${
              isMyTurn
                ? "bg-green-950/20 border-green-500/50 shadow-[0_8px_32px_rgba(34,197,94,0.3)]"
                : "bg-[#333]/20 border-purple-400/25 shadow-[0_8px_32px_rgba(230,0,255,0.25)]"
            }`}
        >
          {/* Tab switcher */}
          <div className="flex gap-2 mb-3 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setMobileTab("table")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg
                ${
                  mobileTab === "table"
                    ? "bg-white/20 text-white shadow"
                    : "text-white/40"
                }`}
            >
              Table
            </button>
            <button
              onClick={() => setMobileTab("opponents")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg
                ${
                  mobileTab === "opponents"
                    ? "bg-white/20 text-white shadow"
                    : "text-white/40"
                }`}
            >
              Opponents ({opponents.length})
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {mobileTab === "table" ? (
              <DiscardSection
                topDiscard={topDiscard}
                gameState={gameState}
                isMyTurn={isMyTurn}
                onDraw={handleDrawCard}
                onPass={handlePassTurn}
                selectedCard={selectedCard}
                canDraw={!hasPlayableCard()}
              />
            ) : (
              <OpponentGrid
                opponents={opponents}
                peek={peek}
                onPeek={handlePeek}
                page={opponentPage}
                totalPages={oppPages}
                onPageChange={setOpponentPage}
                isMyTurn={isMyTurn}
                players={gameState?.players}
                currentTurnId={gameState?.players?.[gameState.currentPlayerIndex]?.id}
              />
            )}
          </div>
        </div>

        {/* Bottom: hand + action */}
        <div
          className={`mt-3 rounded-t-3xl p-3 flex flex-col gap-3 transition-all duration-500 backdrop-blur-2xl border-t
            ${
              isMyTurn
                ? "bg-green-950/40 border-green-500/50 shadow-[0_-8px_32px_rgba(34,197,94,0.25)]"
                : "bg-[#333]/30 border-purple-400/25 shadow-[0_-8px_32px_rgba(230,0,255,0.15)]"
            }`}
        >
          {/* Expand toggle */}
          <button
            onClick={() => setIsHandExpanded(!isHandExpanded)}
            className="w-full flex justify-center py-1"
          >
            <svg
              className={`w-6 h-6 text-white/50 transition-transform
                ${isHandExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          <HandSection
            hand={orderedHand}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onCardTap={handleCardTap}
            isValidPlay={isValidPlay}
            page={handPage}
            totalPages={handPages}
            onPageChange={setHandPage}
            isExpanded={isHandExpanded}
            recentNewCardIds={recentNewCardIds}
          />

          {/* Action buttons row */}
          <div className="flex gap-2 h-14 mt-1">
            {showUnoAction ? (
              <>
                <ActionButton
                  label={normalActionLabel}
                  bg={normalActionBg}
                  onClick={normalActionHandler}
                  disabled={normalActionDisabled}
                />
                <ActionButton
                  label={unoActionLabel}
                  bg={unoActionBg}
                  onClick={unoActionHandler}
                  disabled={unoActionDisabled}
                />
              </>
            ) : (
              <ActionButton
                label={normalActionLabel}
                bg={normalActionBg}
                onClick={normalActionHandler}
                disabled={normalActionDisabled}
              />
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP layout — visible from lg (1024 px) upward
      ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 hidden lg:flex flex-col h-full p-6 gap-4">
        {/* Header */}
        <TopBar
          me={me}
          isMyTurn={isMyTurn}
          currentPlayerName={currentPlayerName}
          latestGameEvent={latestGameEvent}
          onOpenSettings={() => setShowSettings(true)}
          secondsLeft={secondsLeft}
          desktop
        />

        {/* Middle columns */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left column: current card + notes */}
          <div className="w-64 flex flex-col gap-4 flex-shrink-0">
            <DiscardSection
              topDiscard={topDiscard}
              gameState={gameState}
              isMyTurn={isMyTurn}
              onDraw={handleDrawCard}
              onPass={handlePassTurn}
              selectedCard={selectedCard}
              desktop
            />
            <div
              className="flex-1 max-h-[40%] rounded-3xl overflow-hidden flex flex-col"
            >
              <NotesPanel
                notes={notes}
                noteInput={noteInput}
                onNoteInputChange={setNoteInput}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                isMyTurn={isMyTurn}
              />
            </div>
          </div>

          {/* Centre column: opponents */}
          <OpponentGrid
            opponents={opponents}
            peek={peek}
            onPeek={handlePeek}
            page={opponentPage}
            totalPages={oppPages}
            onPageChange={setOpponentPage}
            isMyTurn={isMyTurn}
            players={gameState?.players}
            currentTurnId={gameState?.players?.[gameState.currentPlayerIndex]?.id}
            desktop
          />

          {/* Right column: messages placeholder */}
          <div
            className={`w-72 flex-shrink-0 rounded-3xl p-5 border flex flex-col transition-all duration-500 backdrop-blur-2xl
              ${
                isMyTurn
                  ? "bg-green-950/20 border-green-500/50 shadow-[0_8px_32px_rgba(34,197,94,0.3)]"
                  : "bg-[#333]/20 border-purple-400/25 shadow-[0_8px_32px_rgba(230,0,255,0.25)]"
              }`}
          >
            <p
              className="text-xs font-bold text-white/40 uppercase
              tracking-widest mb-4"
            >
              Messages
            </p>
            <div
              className="flex-1 border-2 border-dashed border-white/10
              rounded-2xl flex items-center justify-center"
            >
              <p className="text-sm font-bold text-white/20 text-center px-6">
                Space for Future Message Section
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row: hand + master action */}
        <div className="flex gap-4 flex-shrink-0 h-40">
          <HandSection
            hand={orderedHand}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onCardTap={handleCardTap}
            isValidPlay={isValidPlay}
            desktop
            recentNewCardIds={recentNewCardIds}
          />
          {showUnoAction ? (
            <div
              className="w-72 flex-shrink-0 flex flex-col gap-3 p-4
                bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10"
            >
              <button
                onClick={normalActionHandler}
                disabled={normalActionDisabled}
                className={`flex-1 w-full rounded-2xl font-black text-xl uppercase
                  tracking-widest transition-all duration-200 border-2 ${normalActionBg}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {normalActionLabel}
              </button>
              <button
                onClick={unoActionHandler}
                disabled={unoActionDisabled}
                className={`flex-1 w-full rounded-2xl font-black text-xl uppercase
                  tracking-widest transition-all duration-200 border-2 ${unoActionBg}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                {unoActionLabel}
              </button>
            </div>
          ) : (
            <ActionButton
              label={normalActionLabel}
              bg={normalActionBg}
              onClick={normalActionHandler}
              disabled={normalActionDisabled}
              desktop
            />
          )}
        </div>
      </div>
    </div>
  );
}
