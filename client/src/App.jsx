import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import OfflineSetup from "./pages/OfflineSetup";
import { Route, Routes } from "react-router-dom";

const App = () => {
  const [darkMode, setDarkMode] = useState(true);

  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Show rotate screen
  if (!isLandscape) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 px-6 text-center text-white">
        <h1 className="text-2xl font-bold">Please rotate your device</h1>
      </div>
    );
  }
  return (
    <div className="h-dvh overflow-hidden ">
      {/* routers */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/offline-setup" element={<OfflineSetup />} />
      </Routes>
    </div>
  );
};

export default App;
