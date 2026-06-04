import { useEffect, useState, useContext } from "react";
import Landing from "./pages/Landing";

import { Route, Routes, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import { Toaster } from "react-hot-toast";
import RoomCreator from "./pages/RoomCreator";
import JoinRoom from "./pages/JoinRoom";
import Game from "./pages/Game";
import { SettingsContext } from "./context/SettingsContext";

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const { setShowSettings } = useContext(SettingsContext);
  const location = useLocation();

  const showGearIcon = !location.pathname.startsWith("/game/");

  return (
    <div className="h-dvh overflow-hidden relative">
      <Toaster position="top-right" reverseOrder={false} />

      {showGearIcon && (
        <button
          onClick={() => setShowSettings(true)}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-purple-300 hover:text-purple-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(150,80,255,0.25)] flex items-center justify-center cursor-pointer"
          title="Game Settings"
        >
          <svg
            className="w-6 h-6 animate-[spin_10s_linear_infinite]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* routers */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby/:roomCode" element={<Lobby />} />
        <Route path="/joinRoom" element={<JoinRoom />} />
        <Route path="/roomCreator" element={<RoomCreator />} />
        <Route path="/game/:roomCode" element={<Game />} />

        <Route path="/auth" element={<Auth />}></Route>
      </Routes>
    </div>
  );
};

export default App;
