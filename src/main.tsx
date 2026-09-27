import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeContextProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthProvider";
import InstallPrompt from "./components/InstallPrompt";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeContextProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <InstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </ThemeContextProvider>
  </StrictMode>
);

// Service worker: offline app shell + instant repeat loads. Dev is left alone
// so an installed worker never serves stale modules over Vite's HMR.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("Service worker registration failed:", err));
  });
}
