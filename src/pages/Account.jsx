import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useNpaid } from "../context.js";
import { formatSol, shortAddress } from "../npaid";

const X_ERRORS = {
  denied: "X sign-in was cancelled.",
  state: "X sign-in could not be confirmed. Try again.",
  token: "X did not return an account. Check the app callback URL and keys.",
};

export default function Account() {
  const { state, connectWallet, signOutX, saveWallet } = useNpaid();
  const [params] = useSearchParams();
  const [error, setError] = useState(X_ERRORS[params.get("x")] || "");
  const claims = state.raids.flatMap((raid) =>
    raid.claims
      .filter((claim) => claim.wallet === state.wallet || (state.handle && claim.handle.toLowerCase() === state.handle.toLowerCase()))
      .map((claim) => ({ ...claim, raid })),
  );
  const linked = state.linkedWallet && state.linkedWallet === state.wallet;
  const mismatch = state.linkedWallet && state.wallet && state.linkedWallet !== state.wallet;

  async function onPhantom() {
    setError("");
    try {
      await connectWallet();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Wallet was not connected.";
      if (!/user rejected/i.test(message)) setError(message);
    }
  }

  return (
    <section className="narrow">
      <p className="kicker">Account</p>
      <h1>Sign in, then link a wallet.</h1>
      <div className="panel wallet-box">
        <h2>X</h2>
        {state.xUserId ? (
          <p className="address">@{state.handle}</p>
        ) : (
          <p>Sign in so NPaid can read your X account id. A typed handle is not accepted.</p>
        )}
        <div className="row-actions">
          {state.xUserId ? (
            <button type="button" className="ghost" onClick={() => signOutX().catch(() => setError("Could not sign out."))}>
              Sign out
            </button>
          ) : (
            <a className="ghost" href="/api/x/start">
              Sign in with X
            </a>
          )}
        </div>
      </div>
      <div className="panel wallet-box">
        <h2>Wallet</h2>
        {state.wallet ? <p className="address">{shortAddress(state.wallet)}</p> : <p>No wallet yet.</p>}
        {linked ? <p className="ok">Linked to @{state.handle}.</p> : null}
        {mismatch ? <p className="error">This X account is linked to {shortAddress(state.linkedWallet)}.</p> : null}
        <div className="row-actions">
          <button type="button" className="ghost" onClick={onPhantom}>
            {state.wallet ? "Switch with Phantom" : "Connect Phantom"}
          </button>
          {state.wallet ? (
            <button type="button" className="texty" onClick={() => saveWallet("")}>
              Disconnect
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <h2>Reward record</h2>
      {claims.length === 0 ? (
        <p className="meta">No replies recorded for this account yet.</p>
      ) : (
        <ul className="claims">
          {claims.map((claim) => (
            <li key={claim.replyUrl}>
              <Link to={`/raid/${claim.raid.id}`}>{claim.raid.title}</Link>
              <p>{formatSol(claim.raid.rewardMilli)}</p>
              <a href={claim.replyUrl} target="_blank" rel="noopener noreferrer">
                View reply
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
