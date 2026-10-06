import { useState } from "react";
import { Link } from "react-router-dom";
import { formatSol, isOpen, slotsLeft, timeLeft } from "../npaid";
import { useNpaid } from "../context.js";
import { useNow } from "../useNow.js";

export default function Board() {
  const { state } = useNpaid();
  const now = useNow();
  const [showClosed, setShowClosed] = useState(false);
  const rows = state.raids.filter((raid) => showClosed || isOpen(raid, now));

  return (
    <section className="board">
      <div className="hero">
        <p className="kicker">Raid to earn</p>
        <h1>One click to send encouragement.</h1>
        <p className="lede">
          Pick a supportive line, reply to the campaign tweet, then paste your reply link. Each account and wallet can be rewarded once.
        </p>
      </div>
      <div className="board-bar">
        <h2>{showClosed ? "All raids" : "Open raids"}</h2>
        <button type="button" className="texty" onClick={() => setShowClosed((value) => !value)}>
          {showClosed ? "Hide closed" : "Show closed"}
        </button>
      </div>
      {state.raidsError ? <p className="banner">{state.raidsError}</p> : null}
      {!state.raidsReady ? (
        <p className="meta">Loading raids.</p>
      ) : rows.length === 0 ? (
        <div className="empty">
          <p>No open raids yet.</p>
          <Link to="/new" className="go">
            New raid
          </Link>
        </div>
      ) : (
        <ul className="raid-list">
          {rows.map((raid) => {
            const open = isOpen(raid, now);
            const slots = slotsLeft(raid);
            return (
              <li key={raid.id}>
                <Link to={`/raid/${raid.id}`} className="raid-row">
                  <div>
                    <p className="row-title">{raid.title}</p>
                    <p className="meta">
                      @{raid.author}
                      {raid.sample ? " · sample" : ""}
                    </p>
                  </div>
                  <p>{formatSol(raid.rewardMilli)}</p>
                  <p>{open ? timeLeft(raid.endsAt, now) : "closed"}</p>
                  <p className="slots">{open ? `${slots} ${slots === 1 ? "slot" : "slots"}` : "—"}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
