import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/fredoka";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { preloadAssets } from "./utils/assets";

import { SettingsProvider } from "./context/SettingsContext";

async function startApp() {
  try {
    console.log("Loading assets...");

    await preloadAssets();

    console.log("Assets loaded!");

    ReactDOM.createRoot(document.getElementById("root")).render(
      <BrowserRouter>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </BrowserRouter>,
    );
  } catch (error) {
    console.error("Failed to load assets:", error);
  }
}

startApp();
