import { useEffect, useRef, useState } from "react";
import { SPECIES, speciesById } from "../data/species";
import { current, startLife, stageOf } from "../game/engine";
import { formatDate, formatYear } from "../game/calendar";
import type { GameState } from "../game/types";
import { Icon, Photo, Tag } from "./UI";
import "./Immersive.css";
const steps = ["Species", "Birthplace", "Birth date", "Circumstances"];
export function BirthSequence({
  game,
  initialSpecies,
  onBegin,
  onCancel,
  onResume,
}: {
  game: GameState;
  initialSpecies?: string;
  onBegin: (s: GameState) => void;
  onCancel: () => void;
  onResume: () => void;
}) {
  const [mode, setMode] = useState(initialSpecies ? "manual" : "random");
  const [speciesId, setSpeciesId] = useState(initialSpecies ?? "wolf");
  const [seed, setSeed] = useState(() => `life-${Date.now().toString(36)}`);
  const [draft, setDraft] = useState<GameState | null>(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);
  const a = draft ? current(draft) : undefined,
    sp = speciesById(a?.speciesId ?? speciesId);
  const env = draft?.environment;
  function draw() {
    try {
      setDraft(
        startLife(game, {
          speciesId: mode === "manual" ? speciesId : undefined,
          seed,
        }),
      );
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (current(game)?.alive)
    return (
      <main className="birth-screen blocked-birth">
        <Tag>ONE LIFE AT A TIME</Tag>
        <h1>A life is already unfolding.</h1>
        <p>
          Your current animal remains safe in your notebook. Finish or
          explicitly abandon that life in Settings before drawing another.
        </p>
        <button className="button primary" onClick={onResume}>
          Continue Life
        </button>
        <button className="text-button" onClick={onCancel}>
          Main Menu
        </button>
      </main>
    );
  return (
    <main className="birth-screen" aria-label="Birth sequence">
      <div className="birth-atmosphere">
        <Photo species={sp} />
      </div>
      <header className="immersive-topbar">
        <button className="text-button" onClick={onCancel}>
          ← Main Menu
        </button>
        <span>LOTTERY OF LIFE</span>
        <Tag>THE FIRST BREATH</Tag>
      </header>
      <div className="birth-focus">
        <ol className="reveal-progress" aria-label="Birth stages">
          {steps.map((label, i) => (
            <li
              key={label}
              className={step > i ? "revealed" : ""}
              aria-current={step === i + 1 ? "step" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{label}</b>
            </li>
          ))}
        </ol>
        {!draft ? (
          <section className="birth-setup">
            <p className="eyebrow">LET NATURE SET THE STAGE</p>
            <h1 ref={heading} tabIndex={-1}>
              A life you’ve never lived.
            </h1>
            <p className="birth-intro">
              An animal. A place. A moment in Earth’s history.
              <br />
              Discover your beginning, one reveal at a time.
            </p>
            <div className="segmented">
              <button
                aria-pressed={mode === "random"}
                className={mode === "random" ? "selected" : ""}
                onClick={() => setMode("random")}
              >
                Random species
              </button>
              <button
                aria-pressed={mode === "manual"}
                className={mode === "manual" ? "selected" : ""}
                onClick={() => setMode("manual")}
              >
                Choose species
              </button>
            </div>
            {mode === "manual" ? (
              <label className="input-label">
                Unlocked species
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                >
                  {SPECIES.filter((s) => game.unlocked.includes(s.id)).map(
                    (s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ) : (
              <p className="muted">
                Equal chances across your {game.unlocked.length} unlocked
                species.
              </p>
            )}
            <details className="seed-settings">
              <summary>World seed & historical scope</summary>
              <label className="input-label">
                World seed
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  maxLength={100}
                />
              </label>
              <p>
                Years are sampled continuously within each species’ supported
                history, with compatible habitats. The same seed and choices
                reproduce the same beginning.
              </p>
            </details>
            {error && <p role="alert">{error}</p>}
            <button
              className="button primary full"
              disabled={!seed.trim()}
              onClick={draw}
            >
              Reveal species <Icon name="arrow" />
            </button>
            <p className="birth-fineprint">
              Your life is saved when you choose Begin Life.
            </p>
          </section>
        ) : (
          a &&
          env && (
            <section className="reveal-content" key={step} aria-live="polite">
              <p className="eyebrow">
                REVEAL {String(step).padStart(2, "0")} / 04 · {steps[step - 1]}
              </p>
              {step === 1 && (
                <>
                  <Tag tone="gold">
                    {sp.rarity} · {sp.group.split(" · ")[0]}
                  </Tag>
                  <h1 ref={heading} tabIndex={-1}>
                    {sp.name}
                  </h1>
                  <i>{sp.scientific}</i>
                  <p className="reveal-description">{sp.challenge}</p>
                  <p className="muted">
                    {sp.reproductive
                      ? "A new individual, with its own strengths and vulnerabilities."
                      : "A female colony worker. Success can mean supporting others, without reproducing."}
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <Tag>{env.location.continent}</Tag>
                  <h1 ref={heading} tabIndex={-1}>
                    {env.location.region}
                  </h1>
                  <p className="reveal-description">{env.location.habitat}</p>
                  <div className="reveal-facts">
                    <div>
                      <small>GEOGRAPHY</small>
                      <b>{env.location.continent}</b>
                    </div>
                    <div>
                      <small>CONDITIONS</small>
                      <b>
                        {Math.round(env.temperature)}°C · {env.weather}
                      </b>
                    </div>
                  </div>
                  <p className="muted">
                    A broad ecological region is used where precise historical
                    locations cannot be supported. No invented political
                    borders.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <Tag>{env.history?.epoch}</Tag>
                  <h1 ref={heading} tabIndex={-1}>
                    {formatYear(a.birth.year)}
                  </h1>
                  <p className="reveal-description">{formatDate(a.birth)}</p>
                  <p>{env.history?.description}</p>
                  <p className="muted">{sp.history.evidence}</p>
                  <details className="seed-settings">
                    <summary>About historical precision</summary>
                    <p>{env.history?.approximation}</p>
                    <p>
                      Supported sampling window: {formatYear(sp.existence[0])} –{" "}
                      {formatYear(sp.existence[1])}. This is not a claim that
                      the species first appeared at the lower bound.
                    </p>
                  </details>
                </>
              )}
              {step === 4 && (
                <>
                  <Tag>GENERATION 01 · {a.caste ?? a.sex}</Tag>
                  <h1 ref={heading} tabIndex={-1}>
                    Meet {a.name}.
                  </h1>
                  <p className="reveal-description">
                    {stageOf(a).name} · {sp.name}
                  </p>
                  <p>{a.circumstances}</p>
                  <div className="reveal-facts">
                    <div>
                      <small>RESILIENCE</small>
                      <b>{Math.round(a.traits.resilience)}</b>
                    </div>
                    <div>
                      <small>PERCEPTION</small>
                      <b>{Math.round(a.traits.perception)}</b>
                    </div>
                    <div>
                      <small>HEALTH</small>
                      <b>{Math.round(a.stats.health)}/100</b>
                    </div>
                  </div>
                  <p className="muted">
                    Care, climate and local resources will shape what happens
                    next. Survival is never guaranteed.
                  </p>
                </>
              )}
              <button
                className="button primary full"
                onClick={() => (step < 4 ? setStep(step + 1) : onBegin(draft))}
              >
                {step === 4
                  ? "Begin Life"
                  : `Reveal ${steps[step].toLowerCase()}`}
                <Icon name="arrow" />
              </button>
            </section>
          )
        )}
      </div>
      <div className="birth-edge-note">
        ONE LIVING WORLD · COUNTLESS POSSIBLE BEGINNINGS
      </div>
    </main>
  );
}
