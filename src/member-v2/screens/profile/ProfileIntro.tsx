import type { CSSProperties } from "react";

// The beat before the flow: what the brief is for, how long it takes, and that
// the whole thing is keyboard-driven. Each tile's art idles still and animates
// on hover/focus (CSS only — see .pf-welcome in profile.css).

function BriefArt() {
  return (
    <div className="pf-w-art pf-w-art-brief" aria-hidden="true">
      <div className="pf-w-clip">
        <span className="pf-w-clip-clamp" />
        {[0, 1, 2].map((i) => (
          <div className="pf-w-clip-row" key={i} style={{ "--i": i } as CSSProperties}>
            <i />
            <span />
          </div>
        ))}
        <svg className="pf-w-clip-check" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="14" />
          <path d="M13.5 20.4l4.6 4.6 8.4-9.4" />
        </svg>
      </div>
    </div>
  );
}

function TimeArt() {
  return (
    <div className="pf-w-art pf-w-art-time" aria-hidden="true">
      <svg viewBox="0 0 96 96">
        <circle className="pf-w-ring-track" cx="48" cy="48" r="30" />
        <circle className="pf-w-ring-sweep" cx="48" cy="48" r="30" />
      </svg>
      <span className="pf-w-ring-label">3–5</span>
    </div>
  );
}

function KeysArt() {
  return (
    <div className="pf-w-art pf-w-art-keys" aria-hidden="true">
      <div className="pf-w-keyrow">
        <span className="pf-w-key">1</span>
        <span className="pf-w-key is-picked">2</span>
        <span className="pf-w-key">3</span>
      </div>
      <span className="pf-w-key pf-w-key-enter">Enter ↵</span>
    </div>
  );
}

const TILES = [
  {
    art: <BriefArt />,
    title: "It becomes your doctor brief",
    body: "Your doctor reads it before you sit down.",
  },
  {
    art: <TimeArt />,
    title: "Takes 3 to 5 minutes",
    body: "Answers save as you go.",
  },
  {
    art: <KeysArt />,
    title: "Your keyboard works",
    body: "Press a number to pick your answer, Enter to move on.",
  },
];

function ProfileIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="pf-welcome">
      <div className="pf-welcome-head">
        <span className="pf-welcome-eyebrow">Before we start</span>
        <h2>
          A few questions, so your doctor gets to <em>know you better</em>
        </h2>
        <p>The more honest your answers, the better your care.</p>
      </div>

      <div className="pf-welcome-tiles">
        {TILES.map((tile) => (
          <article className="pf-welcome-tile" key={tile.title} tabIndex={0}>
            {tile.art}
            <h3>{tile.title}</h3>
            <p>{tile.body}</p>
          </article>
        ))}
      </div>

      <div className="pf-welcome-actions">
        <button className="p-btn" type="button" onClick={onStart} autoFocus>
          Start
        </button>
        <span className="pf-enter-hint">
          press <kbd>Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
}

export default ProfileIntro;
