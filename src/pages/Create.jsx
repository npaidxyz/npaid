import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkRaidDraft } from "../npaid";
import { useNpaid } from "../context.js";

const EMPTY = {
  title: "",
  tweetUrl: "",
  pool: "1",
  reward: "0.01",
  hours: "24",
  templates: ["Keep going. This is worth seeing.", ""],
};

export default function Create() {
  const navigate = useNavigate();
  const { addRaid } = useNpaid();
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState("");

  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setTemplate(index, value) {
    setDraft((current) => {
      const templates = [...current.templates];
      templates[index] = value;
      return { ...current, templates };
    });
  }

  async function onSubmit(event) {
    event.preventDefault();
    const checked = checkRaidDraft(draft);
    if (checked.error) {
      setError(checked.error);
      return;
    }
    try {
      const id = await addRaid(draft);
      navigate(`/raid/${id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the raid.");
    }
  }

  return (
    <section className="narrow">
      <p className="kicker">New raid</p>
      <h1>Open a pool for support.</h1>
      <p className="lede">Paste a tweet that asked to be seen. People reply with a line you approved.</p>
      <form onSubmit={onSubmit} className="stack form">
        <label htmlFor="title">Title</label>
        <input id="title" value={draft.title} onChange={(event) => setField("title", event.target.value)} placeholder="Back today's thread" />

        <label htmlFor="tweet">Tweet URL</label>
        <input
          id="tweet"
          value={draft.tweetUrl}
          onChange={(event) => setField("tweetUrl", event.target.value)}
          placeholder="https://x.com/name/status/123"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
        />

        <div className="pair">
          <div>
            <label htmlFor="pool">Pool (SOL)</label>
            <input id="pool" inputMode="decimal" value={draft.pool} onChange={(event) => setField("pool", event.target.value)} />
          </div>
          <div>
            <label htmlFor="reward">Reward per reply (SOL)</label>
            <input id="reward" inputMode="decimal" value={draft.reward} onChange={(event) => setField("reward", event.target.value)} />
          </div>
        </div>

        <label htmlFor="hours">Duration</label>
        <select id="hours" value={draft.hours} onChange={(event) => setField("hours", event.target.value)}>
          <option value="6">6 hours</option>
          <option value="12">12 hours</option>
          <option value="24">24 hours</option>
          <option value="48">48 hours</option>
          <option value="72">72 hours</option>
        </select>

        <fieldset className="stack">
          <legend>Lines people may reply with</legend>
          {draft.templates.map((line, index) => (
            <input
              key={index}
              aria-label={`Line ${index + 1}`}
              value={line}
              onChange={(event) => setTemplate(index, event.target.value)}
              placeholder="A supportive line"
            />
          ))}
          {draft.templates.length < 5 ? (
            <button type="button" className="texty" onClick={() => setDraft((current) => ({ ...current, templates: [...current.templates, ""] }))}>
              Add a line
            </button>
          ) : null}
        </fieldset>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="go">
          Open raid
        </button>
      </form>
    </section>
  );
}
