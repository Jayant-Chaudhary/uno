import { useEffect, useState } from "react";
import Landing from "./pages/Landing";

import { Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import { Toaster } from "react-hot-toast";
import RoomCreator from "./pages/RoomCreator";
import JoinRoom from "./pages/JoinRoom";
import Game from "./pages/Game";
const App = () => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="h-dvh overflow-hidden ">
      <Toaster position="top-right" reverseOrder={false} />
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
