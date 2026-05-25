import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import OfflineSetup from "./pages/OfflineSetup";
import { Route, Routes } from "react-router-dom";
import Auth from "./pages/Auth";
import { Toaster } from "react-hot-toast";
const App = () => {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="h-dvh overflow-hidden ">
      <Toaster position="top-right" reverseOrder={false} />
      {/* routers */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/offline-setup" element={<OfflineSetup />} />
        <Route path="/auth" element={<Auth />}></Route>
      </Routes>
    </div>
  );
};

export default App;
