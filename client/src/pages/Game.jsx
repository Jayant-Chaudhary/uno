import { useParams } from "react-router-dom";

// Hook
import { useGameLogic } from "../components/GameUI/components/hooks/Gamelogics";

// Shared / background
import AnimatedBackground from "../components/GameUI/AnimateBackground";
import UnoCard from "../components/GameUI/cardGenerator";

// Overlays
import WildColorPicker from "../components/GameUI/components/WildColorPicker";
import GameOverOverlay from "../components/GameUI/components/GameOverOverlay";
import SettingsModal from "../components/GameUI/components/GameOverOverlay";

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
    actionLabel,
    actionBg,
    actionHandler,
    actionDisabled,
    hasPlayableCard,
    secondsLeft,
  } = useGameLogic(roomCode);

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
          onLeave={() => {
            /* TODO: leave-match logic */
          }}
          onClose={() => setShowSettings(false)}
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
          className={`flex-1 flex flex-col min-h-0 bg-black/30 backdrop-blur-xl
            rounded-3xl p-3 border transition-colors duration-500
            ${
              isMyTurn
                ? "border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                : "border-white/10"
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
              />
            )}
          </div>
        </div>

        {/* Bottom: hand + action */}
        <div
          className={`mt-3 rounded-t-3xl p-3 flex flex-col gap-3
            transition-colors duration-500
            ${
              isMyTurn
                ? "bg-green-950/40 border-t border-green-500/50"
                : "bg-black/60 border-t border-white/10"
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
            hand={me?.hand ?? []}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onCardTap={handleCardTap}
            isValidPlay={isValidPlay}
            page={handPage}
            totalPages={handPages}
            onPageChange={setHandPage}
            isExpanded={isHandExpanded}
          />

          {/* Action buttons row */}
          <div className="flex gap-2 h-14 mt-1">
            <ActionButton
              label={actionLabel}
              bg={actionBg}
              onClick={actionHandler}
              disabled={actionDisabled}
            />
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
              className="flex-1 max-h-[40%] bg-black/30 backdrop-blur-xl
              rounded-3xl overflow-hidden border border-white/10"
            >
              <NotesPanel
                notes={notes}
                noteInput={noteInput}
                onNoteInputChange={setNoteInput}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
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
            desktop
          />

          {/* Right column: messages placeholder */}
          <div
            className="w-72 flex-shrink-0 bg-black/30 backdrop-blur-xl
            rounded-3xl p-5 border border-white/10 flex flex-col"
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
            hand={me?.hand ?? []}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onCardTap={handleCardTap}
            isValidPlay={isValidPlay}
            desktop
          />
          <ActionButton
            label={actionLabel}
            bg={actionBg}
            onClick={actionHandler}
            disabled={actionDisabled}
            desktop
          />
        </div>
      </div>
    </div>
  );
}
