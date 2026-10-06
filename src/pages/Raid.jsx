import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useNpaid } from "../context.js";
import { formatSol, isOpen, poolLeft, replyIntent, shortAddress, slotsLeft, timeLeft } from "../npaid";
import { phantomProvider } from "../phantom";
import { useNow } from "../useNow.js";

export default function Raid() {
  const { id } = useParams();
  const { state } = useNpaid();
  const raid = state.raids.find((item) => item.id === id);

  if (!raid) {
    return (
      <section className="narrow">
        <h1>Raid not found.</h1>
        <Link to="/">Back to the board</Link>
      </section>
    );
  }

  return <RaidDesk key={raid.id} raid={raid} />;
}

function RaidDesk({ raid }) {
  const { state, connectWallet, addClaim } = useNpaid();
  const now = useNow();
  const [template, setTemplate] = useState(raid.templates[0]);
  const [opened, setOpened] = useState(false);
  const [replyUrl, setReplyUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const open = isOpen(raid, now);
  const linked = Boolean(state.xUserId) && state.linkedWallet === state.wallet && state.wallet;
  const mine = raid.claims.find((claim) => claim.wallet === state.wallet || (state.handle && claim.handle === state.handle));
  const selected = raid.templates.includes(template) ? template : raid.templates[0];
  const ready = linked && open && !mine;
  const intent = replyIntent(raid.tweetId, selected);

  async function onPhantom() {
    setError("");
    try {
      await connectWallet();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Wallet was not connected.";
      if (!/user rejected/i.test(message)) setError(message);
    }
  }

  async function onProof(event) {
    event.preventDefault();
    const claimError = await addClaim(raid.id, { template, replyUrl });
    if (claimError) {
      setError(claimError);
      return;
    }
    setError("");
    setNotice("Reply recorded. The reward is ready to claim once escrow is connected.");
  }

  return (
    <article className="raid">
      <header className="raid-head">
        <p className="kicker">{open ? timeLeft(raid.endsAt, now) : "Closed"}</p>
        <h1>{raid.title}</h1>
        <p className="meta">
          Target @{raid.author}
          {raid.sample ? " · sample" : ""}
        </p>
        {raid.note ? <p className="note">{raid.note}</p> : null}
      </header>
      <div className="stats">
        <div>
          <span>Reward</span>
          <strong>{formatSol(raid.rewardMilli)}</strong>
        </div>
        <div>
          <span>Pool left</span>
          <strong>{formatSol(poolLeft(raid))}</strong>
        </div>
        <div>
          <span>Slots</span>
          <strong>{slotsLeft(raid)}</strong>
        </div>
        <div>
          <span>Replies</span>
          <strong>{raid.claims.length}</strong>
        </div>
      </div>
      <div className="split">
        <section className="panel">
          <h2>Target tweet</h2>
          <p className="tweet-link">
            <a href={raid.tweetUrl} target="_blank" rel="noopener noreferrer">
              {raid.tweetUrl}
            </a>
          </p>
          <ol className="steps">
            <li>Sign in with X.</li>
            <li>Connect Phantom and approve the link signature.</li>
            <li>Pick a line, post the reply, then paste the link.</li>
          </ol>
        </section>
        <section className="panel action">
          {mine ? (
            <div>
              <h2>Recorded</h2>
              <p>{mine.template}</p>
              <p>
                <a href={mine.replyUrl} target="_blank" rel="noopener noreferrer">
                  {mine.replyUrl}
                </a>
              </p>
            </div>
          ) : (
            <>
              <h2>Send encouragement</h2>
              {state.xUserId ? (
                <p className="meta">Signed in as @{state.handle}</p>
              ) : (
                <a className="ghost" href="/api/x/start">
                  Sign in with X
                </a>
              )}
              {!linked ? (
                <button type="button" className="ghost" onClick={onPhantom}>
                  {phantomProvider() ? "Connect and link Phantom" : "Install Phantom"}
                </button>
              ) : null}
              {state.linkedWallet && state.wallet && state.linkedWallet !== state.wallet ? (
                <p className="error">This X account is linked to {shortAddress(state.linkedWallet)}.</p>
              ) : null}
              <fieldset className="templates" disabled={!open}>
                <legend>Encouragement line</legend>
                {raid.templates.map((line) => (
                  <label key={line} className={template === line ? "choice on" : "choice"}>
                    <input
                      type="radio"
                      name="template"
                      value={line}
                      checked={selected === line}
                      onChange={() => setTemplate(line)}
                    />
                    {line}
                  </label>
                ))}
              </fieldset>
              {ready ? (
                <a className="go" href={intent} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)}>
                  Send encouragement
                </a>
              ) : (
                <button type="button" className="go" disabled>
                  {open ? "Sign in and link a wallet first" : "Raid closed"}
                </button>
              )}
              {opened && ready ? (
                <form onSubmit={onProof} className="stack proof">
                  <label htmlFor="reply">Your reply link</label>
                  <input
                    id="reply"
                    value={replyUrl}
                    onChange={(event) => setReplyUrl(event.target.value)}
                    placeholder={`https://x.com/${state.handle}/status/…`}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <button type="submit" className="ghost">
                    Record reply
                  </button>
                </form>
              ) : null}
            </>
          )}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? <p className="ok">{notice}</p> : null}
        </section>
      </div>
    </article>
  );
}
