import { useCallback, useEffect, useRef, useState } from "react";
import { StateContext } from "./context.js";
import { shortAddress } from "./npaid";
import { connectPhantom, signPhantomMessage, trustedPhantom } from "./phantom";
import { createClaim, createRaid, fetchRaids } from "./raidsApi";
import { fetchMe, logoutX, requestLinkMessage, submitLink } from "./xApi";

const KEY = "npaid.v2";

function loadIdentity() {
  const empty = { wallet: "", handle: "", xUserId: "", linkedWallet: "", raids: [], raidsError: "", raidsReady: false };
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "");
    if (!parsed) return empty;
    return {
      ...empty,
      wallet: typeof parsed.wallet === "string" ? parsed.wallet : "",
      handle: typeof parsed.handle === "string" ? parsed.handle : "",
      xUserId: typeof parsed.xUserId === "string" ? parsed.xUserId : "",
      linkedWallet: typeof parsed.linkedWallet === "string" ? parsed.linkedWallet : "",
    };
  } catch {
    return empty;
  }
}

export function NpaidProvider({ children }) {
  const [state, setState] = useState(loadIdentity);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    const { wallet, handle, xUserId, linkedWallet } = state;
    localStorage.setItem(KEY, JSON.stringify({ wallet, handle, xUserId, linkedWallet }));
  }, [state]);

  useEffect(() => {
    let cancel = false;
    async function pull() {
      const [me, phantomWallet, board] = await Promise.all([fetchMe(), trustedPhantom(), fetchRaids()]);
      if (cancel) return;
      setState((current) => {
        const next = {
          ...current,
          wallet: phantomWallet || current.wallet,
          raids: board.raids || [],
          raidsError: board.error || "",
          raidsReady: true,
        };
        if (me === null) {
          next.handle = "";
          next.xUserId = "";
          next.linkedWallet = "";
        } else if (me) {
          next.handle = me.username;
          next.xUserId = me.userId;
          next.linkedWallet = me.wallet || "";
        }
        stateRef.current = next;
        return next;
      });
    }
    pull();
    window.addEventListener("focus", pull);
    return () => {
      cancel = true;
      window.removeEventListener("focus", pull);
    };
  }, []);

  const apply = useCallback((recipe) => {
    const next = recipe(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  }, []);

  const connectWallet = useCallback(async () => {
    const wallet = await connectPhantom();
    const current = stateRef.current;
    apply((session) => ({ ...session, wallet }));
    if (!current.xUserId) return;
    if (current.linkedWallet === wallet) return;
    if (current.linkedWallet) {
      throw new Error(`This X account is linked to ${shortAddress(current.linkedWallet)}.`);
    }
    const message = await requestLinkMessage(wallet);
    const signature = await signPhantomMessage(message);
    const linked = await submitLink(signature);
    apply((session) => ({
      ...session,
      wallet,
      handle: linked.username,
      xUserId: linked.userId,
      linkedWallet: linked.wallet,
    }));
  }, [apply]);

  const signOutX = useCallback(async () => {
    await logoutX();
    apply((session) => ({ ...session, handle: "", xUserId: "", linkedWallet: "" }));
  }, [apply]);

  const saveWallet = useCallback((wallet) => {
    apply((session) => ({ ...session, wallet }));
  }, [apply]);

  const addRaid = useCallback(async (draft) => {
    const raid = await createRaid(draft);
    apply((session) => ({
      ...session,
      raidsError: "",
      raids: [raid, ...session.raids.filter((item) => item.id !== raid.id)],
    }));
    return raid.id;
  }, [apply]);

  const addClaim = useCallback(async (raidId, input) => {
    const saved = await createClaim(raidId, input);
    if (saved.error) return saved.error;
    apply((session) => ({
      ...session,
      raids: session.raids.map((item) => (item.id === raidId ? saved.raid : item)),
    }));
    return "";
  }, [apply]);

  return (
    <StateContext.Provider value={{ state, connectWallet, signOutX, saveWallet, addRaid, addClaim }}>
      {children}
    </StateContext.Provider>
  );
}
