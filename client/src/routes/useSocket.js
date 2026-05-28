import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API || "http://localhost:5000";

let socketInstance = null;

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
  onRoomDeleted,
} = {}) {
  const handlersRef = useRef({});

  // for refreshing the handlers
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
      onRoomDeleted,
    };
  });

  useEffect(() => {
    // create socket once
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
      });

      //debugs
      socketInstance.on("connect", () => {
        console.log("socket connected:", socketInstance.id);
      });
      socketInstance.on("connect_error", (err) => {
        console.log("connect error:", err.message);
      });
      socketInstance.on("disconnect", (reason) => {
        console.log("disconnected:", reason);
      });
    }

    window._debugSocket = socketInstance;

    const s = socketInstance;

    const dispatch = (key, data) => {
      if (handlersRef.current[key]) handlersRef.current[key](data);
    };

    const handlers = {
      room_update: (d) => dispatch("onRoomUpdate", d),
      joined: (d) => dispatch("onRoomUpdate", d),
      game_started: (d) => dispatch("onGameStarted", d),
      game_update: (d) => dispatch("onGameUpdate", d),
      game_over: (d) => dispatch("onGameOver", d),
      uno_called: (d) => dispatch("onUnoCalled", d),
      player_disconnected: (d) => dispatch("onPlayerDisconnected", d),
      player_reconnected: (d) => dispatch("onPlayerReconnected", d),
      back_to_lobby: (d) => dispatch("onBackToLobby", d),
      error: (d) => dispatch("onError", d),
      reconnected: (d) => dispatch("onReconnected", d),
      room_deleted: (d) => dispatch("onRoomDeleted", d),
    };

    // remove any existing listeners first to prevent stacking
    Object.entries(handlers).forEach(([event, handler]) => {
      s.off(event);
      s.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        s.off(event, handler);
      });
    };
  }, []);

  // emitters
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

  const passTurn = useCallback((roomCode, playerId) => {
    socketInstance?.emit("pass_turn", { roomCode, playerId });
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

  const intentionalDiscontect = useCallback(() => {
    socketInstance?.emit("intentional_leave");
  });

  const reconnect = useCallback((roomCode, userId, reconnectToken) => {
    socketInstance?.emit("reconnect_player", {
      roomCode,
      userId,
      reconnectToken,
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }, []);

  return {
    joinRoom,
    startGame,
    playCard,
    drawCard,
    passTurn,
    sayUno,
    callOut,
    playAgain,
    reconnect,
    disconnect,
    intentionalDiscontect,
  };
}
