import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API || "http://localhost:5000";

let socketInstance = null; // singleton across re-renders

export function useSocket({
  onRoomUpdate,
  onGameStarted,
  onGameUpdate,
  onGameOver,
  onUnoCalled,
  onPlayerDisconnected,
  onPlayerReconnected,
  onBackToLobby,
  onError,
  onReconnected,
} = {}) {
  const handlersRef = useRef({});

  // keep handlers ref fresh without re-subscribing
  useEffect(() => {
    handlersRef.current = {
      onRoomUpdate,
      onGameStarted,
      onGameUpdate,
      onGameOver,
      onUnoCalled,
      onPlayerDisconnected,
      onPlayerReconnected,
      onBackToLobby,
      onError,
      onReconnected,
    };
  });

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
      });
    }

    const s = socketInstance;

    const dispatch = (key, data) => {
      if (handlersRef.current[key]) handlersRef.current[key](data);
    };

    s.on("room_update", (d) => dispatch("onRoomUpdate", d));
    s.on("joined", (d) => dispatch("onRoomUpdate", d));
    s.on("game_started", (d) => dispatch("onGameStarted", d));
    s.on("game_update", (d) => dispatch("onGameUpdate", d));
    s.on("game_over", (d) => dispatch("onGameOver", d));
    s.on("uno_called", (d) => dispatch("onUnoCalled", d));
    s.on("player_disconnected", (d) => dispatch("onPlayerDisconnected", d));
    s.on("player_reconnected", (d) => dispatch("onPlayerReconnected", d));
    s.on("back_to_lobby", (d) => dispatch("onBackToLobby", d));
    s.on("error", (d) => dispatch("onError", d));
    s.on("reconnected", (d) => dispatch("onReconnected", d));

    return () => {
      s.off("room_update");
      s.off("joined");
      s.off("game_started");
      s.off("game_update");
      s.off("game_over");
      s.off("uno_called");
      s.off("player_disconnected");
      s.off("player_reconnected");
      s.off("back_to_lobby");
      s.off("error");
      s.off("reconnected");
    };
  }, []); // mount only

  // ── Emit helpers
  const joinRoom = useCallback((roomCode, userId, reconnectToken) => {
    socketInstance?.emit("joinRoom", { roomCode, userId, reconnectToken });
  }, []);

  const startGame = useCallback((roomCode, hostId) => {
    socketInstance?.emit("StartGame", { roomCode, hostId });
  }, []);

  const playCard = useCallback((roomCode, playerId, cardId, chosenColor) => {
    socketInstance?.emit("PlayCards", {
      roomCode,
      playerId,
      cardId,
      chosenColor,
    });
  }, []);

  const drawCard = useCallback((roomCode, playerId) => {
    socketInstance?.emit("draw_card", { roomCode, playerId });
  }, []);

  const sayUno = useCallback((roomCode, playerId) => {
    socketInstance?.emit("SayUno", { roomCode, playerId });
  }, []);

  const callOut = useCallback((roomCode, callerId, targetId) => {
    socketInstance?.emit("CallOut", { roomCode, callerId, targetId });
  }, []);

  const playAgain = useCallback((roomCode, hostId) => {
    socketInstance?.emit("play_again", { roomCode, hostId });
  }, []);

  const reconnect = useCallback((roomCode, userId, reconnectToken) => {
    socketInstance?.emit("reconnect_player", {
      roomCode,
      userId,
      reconnectToken,
    });
  }, []);

  return {
    joinRoom,   
    startGame,
    playCard,
    drawCard,
    sayUno,
    callOut,
    playAgain,
    reconnect,
  };
}
