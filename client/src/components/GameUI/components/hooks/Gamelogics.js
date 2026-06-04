import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../../../routes/useSocket";
import { SettingsContext } from "../../../../context/SettingsContext";
import API from "../../../../api/AuthApi";
import toast from "react-hot-toast";
import {
  NOTES_KEY,
  PEEK_COOLDOWN,
  HAND_PER_PAGE,
  OPP_PER_PAGE,
} from "../constants/gameConstants";

export function useGameLogic(roomCode) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    musicEnabled,
    setMusicEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    playUno,
    playTurn,
    showSettings,
    setShowSettings,
  } = useContext(SettingsContext);

  const [unoCallInfo, setUnoCallInfo] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("uno_user") || "null");
  const myId = currentUser?.userId || currentUser?.reconnectToken || null;

  // ── Core state ─────────────────────────────────────────────────────────────
  // location.state?.gameState is only a visual placeholder for the first render.
  // The real authoritative state always comes from the server fetch below.
  const [gameState, setGameState] = useState(location.state?.gameState || null);
  const [gameStateVerified, setGameStateVerified] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showWildPicker, setShowWildPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  // Pagination
  const [opponentPage, setOpponentPage] = useState(0);
  const [handPage, setHandPage] = useState(0);

  // Peek: { targetId, secondsLeft } | null
  const [peek, setPeek] = useState(null);
  const peekRef = useRef(null);

  // Notes (persisted to localStorage)
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(NOTES_KEY(roomCode)) || "[]");
    } catch {
      return [];
    }
  });
  const [noteInput, setNoteInput] = useState("");

  // UI toggles
  const [mobileTab, setMobileTab] = useState("table");
  const [isHandExpanded, setIsHandExpanded] = useState(false);
  const [opponentAway, setOpponentAway] = useState(null);
  const [unoClicked, setUnoClicked] = useState(false);

  useEffect(() => {
    setUnoClicked(false);
  }, [gameState]);

  const [recentNewCardIds, setRecentNewCardIds] = useState([]);
  const [orderedHand, setOrderedHand] = useState([]);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    const currentMe = gameState?.players?.find((p) => p.id === myId);
    if (!currentMe?.hand) {
      setOrderedHand([]);
      return;
    }

    const serverHand = currentMe.hand;

    setOrderedHand((prevOrdered) => {
      if (!prevOrdered || prevOrdered.length === 0) {
        return serverHand;
      }

      // Filter previous ordered hand to only keep cards that still exist
      const remaining = prevOrdered.filter((card) =>
        serverHand.some((sc) => sc.id === card.id)
      );

      // Find new cards
      const newCards = serverHand.filter(
        (sc) => !prevOrdered.some((card) => card.id === sc.id)
      );

      if (newCards.length > 0) {
        const newIds = newCards.map((c) => c.id);
        // Add to recent new cards
        setRecentNewCardIds((prev) => [...prev, ...newIds]);

        // Set timeout to remove them after 5 seconds
        const tid = setTimeout(() => {
          setRecentNewCardIds((prev) =>
            prev.filter((id) => !newIds.includes(id))
          );
        }, 5000);
        timeoutsRef.current.push(tid);
      }

      return [...newCards, ...remaining];
    });
  }, [gameState, myId]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const prevPlayersRef = useRef([]);

  useEffect(() => {
    if (!gameState?.players) return;

    const prevPlayers = prevPlayersRef.current;
    const currentPlayers = gameState.players;

    currentPlayers.forEach((player) => {
      const prevPlayer = prevPlayers.find((p) => p.id === player.id);
      if (!prevPlayer) return; // Player just joined, not a draw event

      const prevCount = prevPlayer.cardCount ?? prevPlayer.hand?.length ?? 0;
      const currentCount = player.cardCount ?? player.hand?.length ?? 0;

      if (currentCount > prevCount) {
        const diff = currentCount - prevCount;
        const playerName = player.id === myId ? "You" : player.name;

        // Determine the reason
        let reason = "";
        if (diff === 4) {
          reason = " (+4 applied)";
        } else if (diff === 2) {
          // Check if top discard is draw2 or wild_draw4
          const topCardType = gameState.discardPile?.[gameState.discardPile.length - 1]?.type;
          if (topCardType === "draw2" || topCardType === "wild_draw4") {
            reason = " (+2 applied)";
          } else {
            reason = " (Call Out penalty)";
          }
        }

        // Show toast
        const msg = `${playerName} drew ${diff} card${diff > 1 ? "s" : ""}${reason}!`;
        if (player.id === myId) {
          if (diff >= 2) {
            toast.error(msg, { duration: 4000 });
          } else {
            toast.success(msg, { duration: 3000 });
          }
        } else {
          toast(msg, { duration: 3000 });
        }
      }
    });

    // Update ref
    prevPlayersRef.current = gameState.players;
  }, [gameState, myId]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const me = gameState?.players?.find((p) => p.id === myId);
  const opponents = gameState?.players?.filter((p) => p.id !== myId) ?? [];
  const isMyTurn =
    gameState && gameState.players[gameState.currentPlayerIndex]?.id === myId;
  const topDiscard = gameState?.discardPile?.[gameState.discardPile.length - 1];
  const currentPlayerName =
    gameState?.players?.[gameState?.currentPlayerIndex]?.name;
  const latestGameEvent =
    gameState?.lastEventMessage ||
    (isMyTurn
      ? "It's your turn! Make a move."
      : `Waiting for ${currentPlayerName} to play...`);
  const isHost = roomInfo && roomInfo.host_id === myId;
  const TURN_DURATION_S = 30;

  const turnTimeLeft = (() => {
    if (!gameState?.turnTimer?.startedAt) return TURN_DURATION_S;
    const elapsed = Math.floor(
      (Date.now() - gameState.turnTimer.startedAt) / 1000,
    );
    return Math.max(0, TURN_DURATION_S - elapsed);
  })();

  // Pagination slices
  const handCards = orderedHand;
  const handPages = Math.ceil(handCards.length / HAND_PER_PAGE);
  const oppPages = Math.ceil(opponents.length / OPP_PER_PAGE);
  const visibleHand = handCards.slice(
    handPage * HAND_PER_PAGE,
    (handPage + 1) * HAND_PER_PAGE,
  );
  const visibleOpps = opponents.slice(
    opponentPage * OPP_PER_PAGE,
    (opponentPage + 1) * OPP_PER_PAGE,
  );

  // ── isValidPlay ────────────────────────────────────────────────────────────
  const isValidPlay = useCallback(
    (card) => {
      if (!gameState) return false;
      if (card.type === "wild" || card.type === "wild_draw4") return true;
      if (card.color === gameState.currentColor) return true;
      if (card.type === "number" && card.value === gameState.currentValue)
        return true;
      if (card.type !== "number" && card.type === gameState.currentType)
        return true;
      return false;
    },
    [gameState],
  );

  const hasPlayableCard = useCallback(
    () => handCards.some((card) => isValidPlay(card)),
    [handCards, isValidPlay],
  );

  const handleOpponentDisconnected = useCallback(
    ({ disconnectedId, disconnectedName }) => {
      setOpponentAway({ disconnectedId, disconnectedName });
    },
    [],
  );

  const handleOpponentReconnected = useCallback(() => {
    setOpponentAway(null);
  }, []);

  const handleLeave = async () => {
    try {
      const reconnectToken = currentUser?.reconnectToken || null;
      await API.post(`/rooms/${roomCode}/leave`, {
        userId: currentUser?.userId || null,
        reconnectToken,
      });
    } catch (err) {
      // ignore — navigate away regardless
    }
    navigate("/");
  };

  // ── Socket callbacks ───────────────────────────────────────────────────────
  const handleGameUpdate = useCallback(({ gameState: gs }) => {
    console.log(gs);
    setGameState((prev) => {
      // Same turn, same timestamp → nothing meaningful changed, skip re-render
      if (
        prev?.turnTimer?.startedAt === gs?.turnTimer?.startedAt &&
        prev?.currentPlayerIndex === gs?.currentPlayerIndex
      ) {
        return prev;
      }
      return gs;
    });
    setGameStateVerified(true);
    setSelectedCard(null);
  }, []);

  const handleGameOver = useCallback(
    ({ winner, winnerName }) => {
      setGameOver({ id: winner, name: winnerName });
      localStorage.removeItem(NOTES_KEY(roomCode));
    },
    [roomCode],
  );

  const handleBackToLobby = useCallback(() => {
    navigate(`/lobby/${roomCode}`);
  }, [navigate, roomCode]);

  const handleError = useCallback(({ message }) => {
    toast.error(message);
  }, []);

  // Called when reconnect_player socket event comes back from the server.
  // This is the socket path for game state recovery (complements the REST fetch).
  const handleReconnected = useCallback(({ gameState: gs }) => {
    if (gs) {
      setGameState(gs);
      setGameStateVerified(true);
    }
  }, []);

  const handleUnoCalled = useCallback(({ playerId }) => {
    const playerObj = gameState?.players?.find((p) => p.id === playerId);
    const callerName = playerObj?.name || "Someone";
    setUnoCallInfo({ playerName: callerName });
    playUno();
  }, [gameState, playUno]);

  const {
    playCard,
    drawCard,
    passTurn,
    sayUno,
    callOut,
    playAgain,
    reconnect,
  } = useSocket({
    onGameUpdate: handleGameUpdate,
    onGameOver: handleGameOver,
    onBackToLobby: handleBackToLobby,
    onError: handleError,
    onReconnected: handleReconnected,
    onOpponentDisconnected: handleOpponentDisconnected,
    onOpponentReconnected: handleOpponentReconnected,
    onUnoCalled: handleUnoCalled,
  });

  // ── On mount: always fetch authoritative game state from server ────────────
  useEffect(() => {
    let cancelled = false;

    async function initGame() {
      try {
        // 1. Room info (for host detection)
        const roomRes = await API.get(`/rooms/${roomCode}`);
        if (!cancelled) setRoomInfo(roomRes.data.room);

        // 2. Authoritative game state — never trust location.state after a
        //    refresh because the game engine may have moved on.
        //    Guests send their reconnectToken as a query param since they
        //    have no JWT; the server's softAuth reads it from req.query.
        const reconnectToken = currentUser?.reconnectToken || null;
        const url = reconnectToken
          ? `/rooms/${roomCode}/game-state?reconnectToken=${reconnectToken}`
          : `/rooms/${roomCode}/game-state`;

        const gameRes = await API.get(url);

        if (!cancelled && gameRes.data.gameState) {
          setGameState(gameRes.data.gameState);
          setGameStateVerified(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          navigate("/");
        }
        // On any other error (401 handled by interceptor, 500 etc.)
        // fall back to the location.state placeholder if it exists,
        // and mark it verified so the player isn't stuck on the spinner.
        if (!cancelled && location.state?.gameState) {
          setGameStateVerified(true);
        }
      }

      // 3. Always reconnect the socket so the server updates our socketId
      //    in gameState.players and resumes pushing live events to us.
      if (!cancelled) {
        reconnect(roomCode, currentUser?.userId, currentUser?.reconnectToken);
      }
    }

    initGame();

    return () => {
      cancelled = true;
      if (peekRef.current) clearInterval(peekRef.current);
    };
  }, [roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist notes
  useEffect(() => {
    localStorage.setItem(NOTES_KEY(roomCode), JSON.stringify(notes));
  }, [notes, roomCode]);

  // Haptic and Sound feedback on turn change
  useEffect(() => {
    if (isMyTurn) {
      playTurn();
    }
  }, [isMyTurn, playTurn]);

  const [secondsLeft, setSecondsLeft] = useState(TURN_DURATION_S);

  useEffect(() => {
    if (!gameState?.turnTimer?.startedAt) {
      setSecondsLeft(TURN_DURATION_S);
      return;
    }

    // Compute immediately so there's no initial flicker
    const compute = () => {
      const elapsed = Math.floor(
        (Date.now() - gameState.turnTimer.startedAt) / 1000,
      );
      setSecondsLeft(Math.max(0, TURN_DURATION_S - elapsed));
    };

    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [gameState?.turnTimer?.startedAt]); // re-runs only when a new turn starts

  // ── Action handlers ────────────────────────────────────────────────────────
  const handleCardTap = (card) => {
    if (!isMyTurn) return;
    setSelectedCard((prev) => (prev?.id === card.id ? null : card));
  };

  const handlePlayCard = () => {
    if (!selectedCard || !isMyTurn) return;
    if (!isValidPlay(selectedCard)) {
      toast.error("Can't play that card");
      return;
    }
    if (selectedCard.type === "wild" || selectedCard.type === "wild_draw4") {
      setPendingWildCard(selectedCard);
      setShowWildPicker(true);
      return;
    }
    playCard(roomCode, myId, selectedCard.id, null);
    setSelectedCard(null);
  };

  const handleWildColorPick = (color) => {
    setShowWildPicker(false);
    if (!pendingWildCard) return;
    playCard(roomCode, myId, pendingWildCard.id, color);
    setSelectedCard(null);
    setPendingWildCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn) return;
    if (hasPlayableCard()) {
      toast.error("You have a playable card — play it or select it first");
      return;
    }
    drawCard(roomCode, myId);
  };

  const handlePassTurn = () => {
    if (isMyTurn) passTurn(roomCode, myId);
  };
  const handleSayUno = () => sayUno(roomCode, myId);
  const handleSayUnoWrapped = () => {
    setUnoClicked(true);
    handleSayUno();
  };
  const handleCallOut = (targetId) => callOut(roomCode, myId, targetId);
  const handleCallOutWrapped = (targetId) => {
    setUnoClicked(true);
    handleCallOut(targetId);
  };
  const handlePlayAgain = () => playAgain(roomCode, myId);

  const handlePeek = (playerId) => {
    if (peek) return;
    let seconds = PEEK_COOLDOWN;
    setPeek({ targetId: playerId, secondsLeft: seconds });
    peekRef.current = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        clearInterval(peekRef.current);
        setPeek(null);
      } else {
        setPeek((prev) => (prev ? { ...prev, secondsLeft: seconds } : null));
      }
    }, 1000);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setNotes((prev) => [...prev, noteInput.trim()]);
    setNoteInput("");
  };

  const handleDeleteNote = (index) =>
    setNotes((prev) => prev.filter((_, i) => i !== index));

  // ── Master action button state machine ─────────────────────────────────────
  const myHandSize = me?.hand?.length ?? 0;
  const opponentToCallOut = opponents.find((o) => o.cardCount === 1);
  const showUnoAction = myHandSize === 1 || !!opponentToCallOut;

  // 1. Normal Game Action Button
  let normalActionLabel = "Play Card";
  let normalActionBg = "bg-white/5 text-white/20 border-white/10 cursor-not-allowed";
  let normalActionHandler = () => {};
  let normalActionDisabled = true;

  if (isMyTurn && selectedCard && isValidPlay(selectedCard)) {
    normalActionLabel = "Play Card";
    normalActionBg =
      "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] border-green-400 hover:scale-105 active:scale-95";
    normalActionHandler = handlePlayCard;
    normalActionDisabled = false;
  } else if (isMyTurn && !selectedCard && hasPlayableCard()) {
    normalActionLabel = "Pass Turn";
    normalActionBg =
      "bg-purple-600/30 text-purple-200 border-purple-400/30 hover:bg-purple-600/50 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:scale-105 active:scale-95";
    normalActionHandler = handlePassTurn;
    normalActionDisabled = false;
  } else if (isMyTurn && !selectedCard && !hasPlayableCard()) {
    normalActionLabel = "Draw Card";
    normalActionBg =
      "bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30 hover:scale-105 active:scale-95";
    normalActionHandler = handleDrawCard;
    normalActionDisabled = false;
  }

  // 2. UNO / Callout Action Button
  let unoActionLabel = "Call Out";
  let unoActionBg = "bg-white/5 text-white/20 border-white/10 cursor-not-allowed";
  let unoActionHandler = () => {};
  let unoActionDisabled = true;

  if (myHandSize === 1) {
    unoActionLabel = "UNO!";
    unoActionDisabled = gameState.pendingUno?.playerId !== myId;
    unoActionBg = (unoActionDisabled || unoClicked)
      ? "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
      : "bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95";
    unoActionHandler = handleSayUnoWrapped;
  } else if (opponentToCallOut) {
    unoActionLabel = "Call Out!";
    unoActionDisabled = gameState.pendingUno?.playerId !== opponentToCallOut.id;
    unoActionBg = (unoActionDisabled || unoClicked)
      ? "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
      : "bg-orange-500/20 text-orange-400 border-orange-500 hover:bg-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95";
    unoActionHandler = () => handleCallOutWrapped(opponentToCallOut.id);
  }

  // ── Return everything the UI needs ─────────────────────────────────────────
  return {
    // identity
    myId,
    // state
    gameState,
    gameStateVerified,
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
    unoCallInfo,
    setUnoCallInfo,
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
    visibleHand,
    visibleOpps,
    handPages,
    oppPages,
    peek,
    // functions
    isValidPlay,
    hasPlayableCard,
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
    // action button state machine output
    normalActionLabel,
    normalActionBg,
    normalActionHandler,
    normalActionDisabled,
    unoActionLabel,
    unoActionBg,
    unoActionHandler,
    unoActionDisabled: unoActionDisabled || unoClicked,
    showUnoAction,
    orderedHand,
    recentNewCardIds,
    // turn timer
    secondsLeft,
    opponentAway,
    handleLeave,
  };
}
