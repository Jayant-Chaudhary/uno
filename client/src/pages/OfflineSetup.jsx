import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AnimatedBackground from "../components/AnimatorGrid";

import {
  generateDeck,
  shuffleDeck,
  dealCard,
} from "../../../server/gameEngine";

const PLAYER_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
];

const OfflineSetup = () => {
  const navigate = useNavigate();

  const [playerCount, setPlayerCount] = useState(2);

  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const updatedPlayers = [];

    for (let i = 0; i < playerCount; i++) {
      updatedPlayers.push({
        id: `p${i + 1}`,

        name: localStorage.getItem(`uno_player_${i + 1}`) || `Player ${i + 1}`,

        color:
          localStorage.getItem(`uno_player_color_${i + 1}`) || PLAYER_COLORS[i],
      });
    }

    setPlayers(updatedPlayers);
  }, [playerCount]);

  function handleNameChange(index, value) {
    const updated = [...players];

    updated[index].name = value;

    setPlayers(updated);
  }

  // -----------------------------------
  // HANDLE COLOR CHANGE
  // -----------------------------------

  function handleColorChange(index, color) {
    const updated = [...players];

    updated[index].color = color;

    setPlayers(updated);
  }

  // -----------------------------------
  // START GAME
  // -----------------------------------

  function startGame() {
    // SAVE PLAYERS

    players.forEach((player, index) => {
      localStorage.setItem(`uno_player_${index + 1}`, player.name);

      localStorage.setItem(`uno_player_color_${index + 1}`, player.color);
    });

    // ENGINE PLAYERS

    const gamePlayers = players.map((player) => ({
      id: player.id,

      name: player.name,

      color: player.color,

      hand: [],

      saidUno: false,
    }));

    // CREATE DECK

    const deck = shuffleDeck(generateDeck());

    // INITIAL STATE

    const initialState = {
      players: gamePlayers,

      deck,

      discardPile: [],

      currentPlayerIndex: 0,

      currentColor: null,

      currentValue: null,

      currentType: null,

      direction: 1,

      skip: false,

      pendingUno: null,

      gameOver: false,

      winner: null,
    };

    // DEAL

    const finalState = dealCard(initialState);

    // SAVE

    localStorage.setItem("uno_active_game", JSON.stringify(finalState));

    navigate("/game");
  }

  return (
    <div className="absolute top-0 left-0 h-full w-full overflow-hidden">
      {/* BACKGROUND */}
      <AnimatedBackground />

      {/* MAIN */}

      <div className="relative h-full w-full z-10 flex flex-col justify-between p-4">
        {/* TOP SETTINGS */}

        <div className="bg-[#ffffff2f] backdrop-blur-md rounded-3xl w-full h-[20dvh] p-3 gap-5 flex flex-row justify-center">
          <h3
            className="
          font-game

          text-2xl

          leading-none

          text-purple-300

          [text-shadow:
            2px_2px_0px_#00d9ff,
            5px_5px_0px_#111]
        "
          >
            Select the number of players
          </h3>

          <div className="flex gap-4">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`
                  px-4 py-1 rounded-2xl font-bold transition

                  ${
                    playerCount === count
                      ? "bg-black text-white"
                      : "bg-zinc-200"
                  }
                `}
              >
                {count}P
              </button>
            ))}
          </div>
        </div>

        {/* BOTTOM */}

        <div className="flex flex-row gap-8 pt-4 h-[75dvh]">
          {/* PLAYERS */}

          <div className="bg-amber-50/90 backdrop-blur-md rounded-3xl h-full w-1/2 p-6 overflow-auto">
            <h2 className="text-3xl font-black mb-6">Players</h2>

            <div className="space-y-4">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-4"
                >
                  {/* COLOR */}

                  <div
                    className="h-10 w-10 rounded-full border-4 border-white shadow-lg"
                    style={{
                      backgroundColor: player.color,
                    }}
                  />

                  {/* INPUT */}

                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="flex-1 bg-zinc-100 rounded-xl px-4 py-3 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* COLORS */}

          <div className="bg-amber-50/90 backdrop-blur-md rounded-3xl h-full w-1/2 p-6 flex flex-col">
            <h2 className="text-3xl font-black mb-6">Player Colors</h2>

            <div className="space-y-6 overflow-auto">
              {players.map((player, playerIndex) => (
                <div key={player.id}>
                  <h3 className="font-bold mb-3">{player.name}</h3>

                  <div className="flex gap-3 flex-wrap">
                    {PLAYER_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(playerIndex, color)}
                        className={`
                          h-14 w-14 rounded-full border-4 transition

                          ${
                            player.color === color
                              ? "border-black scale-110"
                              : "border-transparent"
                          }
                        `}
                        style={{
                          backgroundColor: color,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* START BUTTON */}

            <button
              onClick={startGame}
              className="mt-auto bg-black text-white py-4 rounded-2xl font-black text-xl hover:scale-[1.02] transition"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineSetup;
