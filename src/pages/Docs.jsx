import { useEffect } from "react";
import { Link } from "react-router-dom";

const TOC = [
  ["what", "What NPaid is"],
  ["raid", "Opening a raid"],
  ["reply", "The reply"],
  ["signin", "X sign-in"],
  ["wallet", "Linking a wallet"],
  ["record", "Recording a reward"],
  ["pool", "Pools and slots"],
  ["later", "What is not live"],
];

const TOTAL = String(TOC.length).padStart(2, "0");

export default function Docs() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Documentation — NPaid";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <article className="docs">
      <p className="kicker">Documentation</p>
      <h1>
        How NPaid works, <em>raid by raid.</em>
      </h1>
      <p className="lede">
        This is the product, written as documentation. A raid is a pool of encouragement aimed at one tweet. Internal setup, such as directory layout and environment configuration, is left out.
      </p>
      <div className="docs-chips">
        <span>{TOC.length} sections</span>
        <span className="soon">Escrow not live</span>
      </div>

      <p className="kicker">If you only read three</p>
      <div className="docs-picks">
        <a href="#reply">
          <strong>The reply →</strong>
          <span>One click opens X with an approved line. You paste the reply link back.</span>
        </a>
        <a href="#wallet">
          <strong>Linking a wallet →</strong>
          <span>X login plus a Phantom signature. One account stays bound to one wallet.</span>
        </a>
        <a href="#later">
          <strong>What is not live →</strong>
          <span>Reply proof through the X API, and the SOL escrow that would pay the reward.</span>
        </a>
      </div>

      <p className="kicker">Contents</p>
      <ol className="docs-toc">
        {TOC.map(([id, title], index) => (
          <li key={id}>
            <a href={`#${id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {title}
            </a>
          </li>
        ))}
      </ol>

      <section id="what">
        <p className="docs-index">01 / {TOTAL}</p>
        <h2>What NPaid is</h2>
        <p>
          NPaid is a raid-to-earn board. Someone opens a raid on a tweet and funds a pool of rewards. Anyone else picks a supportive line that raid already approved, posts it as a reply, and pastes the link. The reward is recorded for the X account and the wallet that are linked together.
        </p>
        <ul>
          <li>
            <strong>The tweet is the target.</strong> A raid points at one status on X. The reply is meant for that post, not a new thread.
          </li>
          <li>
            <strong>The line is chosen, not typed freehand.</strong> The person who opens the raid writes the lines people may send. A reply uses one of those lines.
          </li>
          <li>
            <strong>The handle has to be real.</strong> Sign-in comes from X. Pasting a username does not count.
          </li>
        </ul>
        <h3>What NPaid is not</h3>
        <p>
          NPaid does not pay for insults. A line that fails the support check is rejected when the raid is created. NPaid also does not custody SOL. Pool numbers are shared, and escrow is not connected yet.
        </p>
        <div className="docs-who">
          <div>
            <span>People who reply</span>
            <p>One click, one approved line, one recorded reward per raid for that account and wallet.</p>
          </div>
          <div>
            <span>People who open a raid</span>
            <p>Paste a tweet, set a pool and a reward, and write the lines that may be used.</p>
          </div>
        </div>
      </section>

      <section id="raid">
        <p className="docs-index">02 / {TOTAL}</p>
        <h2>Opening a raid</h2>
        <p>
          New raid is a single form. The board lists raids that are still open. Sample raids ship with the app so the board is not empty, and they are marked sample.
        </p>
        <ul className="docs-fields">
          <li>
            <div>
              <strong>Title</strong>
              <span>Required</span>
            </div>
            <p>4–80 characters. This is the name on the board.</p>
          </li>
          <li>
            <div>
              <strong>Tweet URL</strong>
              <span>Required</span>
            </div>
            <p>An x.com or twitter.com link that contains /status/ and a numeric id. The author is read from that URL.</p>
          </li>
          <li>
            <div>
              <strong>Pool</strong>
              <span>Required</span>
            </div>
            <p>0.001 to 1,000 SOL, with at most three decimal places. Stored as milli-SOL so the slot math stays exact.</p>
          </li>
          <li>
            <div>
              <strong>Reward</strong>
              <span>Required</span>
            </div>
            <p>At least 0.001 SOL, and never larger than the pool. Each accepted reply takes one reward out of the pool.</p>
          </li>
          <li>
            <div>
              <strong>Duration</strong>
              <span>Required</span>
            </div>
            <p>6, 12, 24, 48, or 72 hours from the moment the raid is opened.</p>
          </li>
          <li>
            <div>
              <strong>Lines</strong>
              <span>Required</span>
            </div>
            <p>1–5 encouragement lines, each 8–180 characters. Insults are rejected.</p>
          </li>
        </ul>
      </section>

      <section id="reply">
        <p className="docs-index">03 / {TOTAL}</p>
        <h2>The reply</h2>
        <p>
          The reply button stays disabled until the X account is signed in, the wallet is the one linked to that account, the raid is still open, and this account has not already been recorded.
        </p>
        <ol className="docs-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Pick a line</strong>
              <p>Choose one of the lines written for this raid.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Open X</strong>
              <p>NPaid opens an X compose intent addressed to the campaign tweet, with that line filled in.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Post it</strong>
              <p>You send the reply from the account you signed in with.</p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Paste the link</strong>
              <p>Copy the status URL of your reply and submit it on the raid.</p>
            </div>
          </li>
        </ol>
        <h3>What the link has to pass</h3>
        <ul>
          <li>It is an x.com or twitter.com status URL.</li>
          <li>It is not the campaign tweet itself.</li>
          <li>The author in the URL is the handle X returned at sign-in.</li>
          <li>The line is one this raid allows.</li>
          <li>This X account and this wallet have not already been recorded on this raid.</li>
        </ul>
      </section>

      <section id="signin">
        <p className="docs-index">04 / {TOTAL}</p>
        <h2>X sign-in</h2>
        <p>
          Sign in with X uses OAuth 2.0, authorization code with PKCE. NPaid asks to read the account and tweets. The access token stays on the server. The browser only keeps a session cookie.
        </p>
        <p>
          After X redirects back, NPaid reads the signed-in user id and handle. That pair is the identity used on every later check. Signing out clears the session in the browser. The wallet binding on the server stays, so the next sign-in of that account restores the same wallet.
        </p>
        <p>
          Open the app at <code>http://127.0.0.1:5173</code> while developing. X rejects a callback that uses <code>localhost</code>.
        </p>
      </section>

      <section id="wallet">
        <p className="docs-index">05 / {TOTAL}</p>
        <h2>Linking a wallet</h2>
        <p>
          X proves the handle. Phantom proves the wallet. NPaid accepts a reward record only when both belong to the same person, and only when that pair was signed.
        </p>
        <ol className="docs-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Sign in with X</strong>
              <p>Without a session there is no account id to bind.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Connect Phantom</strong>
              <p>The wallet address comes from the extension, not from a pasted string.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Sign the link message</strong>
              <p>The server issues a short message: the app name, the account id, the wallet, and a nonce. It expires in five minutes. Phantom signs it. Nothing is sent on-chain.</p>
            </div>
          </li>
          <li>
            <span>4</span>
            <div>
              <strong>Server checks the signature</strong>
              <p>An Ed25519 check confirms the signature matches that wallet. One X account can be linked to one wallet, and that wallet cannot be linked to a second account.</p>
            </div>
          </li>
        </ol>
        <p>
          If this X account is already linked to a different wallet, connect stops and names the address that is already bound.
        </p>
      </section>

      <section id="record">
        <p className="docs-index">06 / {TOTAL}</p>
        <h2>Recording a reward</h2>
        <p>
          A successful paste writes a claim: handle, wallet, the line that was used, the reply URL, and the time. That claim is stored with the raid, so anyone opening the board can see the slot count change. The raid page then says the reply is recorded and the reward is ready to claim once escrow is connected.
        </p>
        <p>
          Account lists the replies recorded for the signed-in handle or the linked wallet. Removing the X session does not delete the shared raid or its claims.
        </p>
      </section>

      <section id="pool">
        <p className="docs-index">07 / {TOTAL}</p>
        <h2>Pools and slots</h2>
        <p>
          Amounts are milli-SOL integers, so 0.01 SOL is 10. Slots left are the pool that remains, divided by the reward, rounded down. Each recorded reply spends one reward. The raid closes when the clock runs out or when no full reward is left.
        </p>
        <div className="docs-who">
          <div>
            <span>Open</span>
            <p>Time remains and at least one reward still fits in the pool.</p>
          </div>
          <div>
            <span>Closed</span>
            <p>The end time has passed, or the pool can no longer pay another reply.</p>
          </div>
        </div>
        <p>The same X account cannot be recorded twice on one raid. The same wallet cannot either, even under another handle.</p>
      </section>

      <section id="later">
        <p className="docs-index">08 / {TOTAL}</p>
        <h2>What is not live</h2>
        <aside className="docs-call">
          <strong>Two steps are still ahead of this build</strong>
          <p>Nothing in this section pays SOL or asks X to confirm the contents of a reply. The board records an intent. It does not settle one.</p>
        </aside>
        <ul className="docs-fields">
          <li>
            <div>
              <strong>Reply proof</strong>
              <span>Not live</span>
            </div>
            <p>The pasted link is checked for shape, author, and that it is not the target tweet. NPaid does not yet ask the X API whether that post replies to the campaign tweet with the chosen line.</p>
          </li>
          <li>
            <div>
              <strong>SOL escrow</strong>
              <span>Not live</span>
            </div>
            <p>The pool and the recorded replies are shared. No escrow holds the SOL, and no payout transaction is sent.</p>
          </li>
        </ul>
        <p>
          Until those two exist, a recorded reply is a place in line, not a payment. <Link to="/">Back to the board</Link> when you want to try the flow.
        </p>
      </section>
    </article>
  );
}
