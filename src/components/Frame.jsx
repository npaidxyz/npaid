import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useNpaid } from "../context.js";
import { shortAddress } from "../npaid";

const THEME_KEY = "npaid.theme";

function storedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function Frame({ children }) {
  const { state, connectWallet } = useNpaid();
  const location = useLocation();
  const [walletError, setWalletError] = useState("");
  const [theme, setTheme] = useState(storedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  async function onConnect() {
    setWalletError("");
    try {
      await connectWallet();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet was not connected.";
      if (!/user rejected/i.test(message)) setWalletError(message);
    }
  }

  return (
    <div className="app-frame">
      <header className="top">
        <NavLink to="/" className="mark" aria-label="NPaid, go to the raid board">
          NPaid
        </NavLink>
        <div className="cluster">
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Board</NavLink>
            <NavLink to="/new">New raid</NavLink>
            <NavLink to="/account">Account</NavLink>
            <NavLink to="/docs">Docs</NavLink>
          </nav>
        </div>
        <div className="session">
          <button
            type="button"
            className="theme"
            aria-pressed={theme === "light"}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
          {state.xUserId ? (
            <span className="pill on" title={`@${state.handle}`}>@{state.handle}</span>
          ) : (
            <a className="ghost" href="/api/x/start">Sign in with X</a>
          )}
          {state.wallet ? (
            <span className="pill on" title={state.wallet}>{shortAddress(state.wallet)}</span>
          ) : (
            <button type="button" className="ghost" onClick={onConnect}>Connect Phantom</button>
          )}
        </div>
      </header>
      <div className="shell">
        {walletError ? <p className="banner">{walletError}</p> : null}
        <main className="stage" key={location.pathname}>
          {children}
        </main>
        <footer className="foot">
          X sign-in is verified with X, and the wallet link is stored on this machine. Raids are shared. Reply proof and payouts are not connected yet.
        </footer>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 3.5A8.5 8.5 0 1 0 20.5 14 7 7 0 0 1 16 3.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
