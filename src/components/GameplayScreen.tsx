import { useEffect, useRef } from "react";
import { speciesById } from "../data/species";
import {
  ACTIONS,
  PHASES,
  actionTitle,
  availableActions,
  current,
  skipOptions,
  stageOf,
} from "../game/engine";
import { ageLabel, formatDate } from "../game/calendar";
import { describeSituation } from "../game/world";
import type { Action, GameState, Pacing, Priority } from "../game/types";
import { Icon, Meter, Photo, Tag } from "./UI";
import "./Immersive.css";
type View = "journal" | "family" | "collection" | "settings" | "menu";
interface Props {
  game: GameState;
  saveStatus: string;
  busy: boolean;
  notice: string;
  onDismiss: () => void;
  onAction: (a: Action) => void;
  onSkip: (n: number) => void;
  onPaced: () => void;
  onChange: (s: GameState) => void;
  onExit: () => void;
  onView: (v: View) => void;
  onGuide: () => void;
}
export function GameplayScreen({
  game,
  saveStatus,
  busy,
  notice,
  onDismiss,
  onAction,
  onSkip,
  onPaced,
  onChange,
  onExit,
  onView,
  onGuide,
}: Props) {
  const a = current(game)!,
    sp = speciesById(a.speciesId),
    env = game.environment!,
    w = game.world;
  const journal = game.journal.filter((e) => e.individualId === a.id);
  const latest = journal.at(-1);
  const children = a.children.map((id) => game.family[id]);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus();
    window.scrollTo(0, 0);
  }, []);
  return (
    <main
      ref={main}
      tabIndex={-1}
      className="gameplay-screen"
      aria-label="Active life"
      aria-busy={busy}
    >
      <header className="immersive-topbar">
        <div className="game-wordmark">
          <Icon name="leaf" />
          <span>LOTTERY OF LIFE</span>
        </div>
        <span className="game-save-status">{saveStatus}</span>
        <button className="button subtle exit-game" onClick={onExit}>
          {saveStatus === "Saved on this device"
            ? "Save & Main Menu"
            : "Main Menu"}{" "}
          <Icon name="home" size={17} />
        </button>
      </header>
      <div className="game-content">
        <section className="animal-banner" aria-label="Animal identity">
          <div className="animal-portrait">
            <Photo species={sp} />
            <span>{sp.rarity}</span>
          </div>
          <div className="animal-identity">
            <p className="eyebrow">
              GENERATION {String(a.generation).padStart(2, "0")} ·{" "}
              {a.caste ?? a.sex}
            </p>
            <h1>
              {a.name}
              <span>{sp.name}</span>
            </h1>
            <p className="identity-stage">
              <b>{ageLabel(a.ageDays)}</b>
              <span>·</span>
              <strong>{stageOf(a).name}</strong>
              <i>{sp.scientific}</i>
            </p>
            <p className="animal-location">
              {env.location.region} · {env.location.habitat}
            </p>
          </div>
          <div className="historical-clock">
            <Tag tone="gold">{env.history?.epoch ?? "Recorded world"}</Tag>
            <b>{formatDate(game.date)}</b>
            <small>
              {Math.round(env.temperature)}°C · {env.weather} ·{" "}
              {w?.season ?? "Seasonal habitat"}
            </small>
          </div>
        </section>
        <div className="game-body">
          <div className="game-main-column">
            <section className="survival-strip" aria-label="Survival condition">
              <Meter label="Health" value={a.stats.health} />
              <Meter label="Hunger" value={a.stats.hunger} reverse />
              <Meter label="Hydration" value={a.stats.hydration} />
              <Meter label="Energy" value={a.stats.energy} />
            </section>
            <section className="phase-stage">
              <div className="phase-heading">
                <p className="eyebrow">
                  DAY {a.ageDays + 1} · {PHASES[game.phase].toUpperCase()}
                </p>
                {stageOf(a).dependent ? (
                  <button
                    className="routine-care-shortcut"
                    disabled={busy}
                    onClick={onPaced}
                  >
                    Advance routine care <Icon name="arrow" size={14} />
                  </button>
                ) : (
                  <span>One action advances one phase</span>
                )}
              </div>
              <ol className="game-phase-track" aria-label="Day phases">
                {PHASES.map((phase, i) => (
                  <li
                    key={phase}
                    className={
                      i === game.phase
                        ? "now"
                        : i < game.phase
                          ? "complete"
                          : ""
                    }
                    aria-current={i === game.phase ? "step" : undefined}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <b>{phase}</b>
                  </li>
                ))}
              </ol>
            </section>
            <section className="current-situation">
              <p className="eyebrow">HERE & NOW</p>
              <h2>
                {stageOf(a).dependent
                  ? "A vulnerable beginning."
                  : a.stats.injury > 15
                    ? "Every movement has a cost."
                    : "Another phase in the living world."}
              </h2>
              <p>{describeSituation(game)}</p>
            </section>
            <section className="decisions" aria-labelledby="decision-title">
              <div className="decision-label">
                <h2 id="decision-title">What will you do?</h2>
                <span>
                  {stageOf(a).dependent
                    ? "Care continues around you"
                    : "Choose your next action"}
                </span>
              </div>
              <div className="game-action-grid">
                {availableActions(game).map((action) => (
                  <button
                    className="game-action"
                    key={action}
                    disabled={busy}
                    onClick={() => onAction(action)}
                  >
                    <span className="game-action-icon">
                      {["move", "explore"].includes(action) ? (
                        <Icon name="arrow" />
                      ) : (
                        ACTIONS[action].icon
                      )}
                    </span>
                    <span>
                      <b>{actionTitle(game, action)}</b>
                      <small>
                        {action === "feed" && stageOf(a).dependent
                          ? "Provisioning and stored reserves depend on the nursery’s conditions."
                          : ACTIONS[action].detail}
                      </small>
                    </span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
              </div>
            </section>
            {latest && latest.kind !== "birth" && (
              <div className={`consequence ${latest.kind}`} role="status">
                <span>LAST CONSEQUENCE · {latest.phase}</span>
                <p>{latest.text}</p>
              </div>
            )}
            {notice && (
              <div className="game-notice" role="status">
                <p>{notice}</p>
                <button aria-label="Dismiss notification" onClick={onDismiss}>
                  ×
                </button>
              </div>
            )}
            <section className="pacing-controls">
              <div>
                <label htmlFor="pacing-mode">Your pace</label>
                <select
                  id="pacing-mode"
                  value={game.pacing}
                  onChange={(e) =>
                    onChange({ ...game, pacing: e.target.value as Pacing })
                  }
                >
                  <option value="immersive">Immersive</option>
                  <option value="balanced">Balanced</option>
                  <option value="story">Story Focus</option>
                </select>
              </div>
              <button
                className="button primary"
                disabled={busy}
                onClick={onPaced}
              >
                {game.pacing === "immersive"
                  ? "Advance routine phase"
                  : stageOf(a).dependent
                    ? "Let routine care continue"
                    : "Let life unfold"}{" "}
                <Icon name="arrow" size={17} />
              </button>
              <p>
                {game.pacing === "immersive"
                  ? "Direct phase decisions, one at a time."
                  : game.pacing === "balanced"
                    ? "Routine phases advance until a meaningful change."
                    : "Quieter periods advance further; milestones and serious danger pause the story."}{" "}
                All modes use the same survival rules.
              </p>
            </section>
          </div>
          <aside className="game-drawers" aria-label="Life notebook">
            <details className="game-drawer">
              <summary>
                <span>Local world</span>
                <small>
                  {env.weather} · {Math.round(w?.daylight ?? 12)}h daylight
                </small>
              </summary>
              <div className="drawer-content">
                <p>
                  {env.location.habitat}. {env.history?.description}
                </p>
                <div className="world-signals">
                  {[
                    ["Water", w?.water],
                    ["Vegetation", w?.vegetation],
                    ["Food organisms", w?.prey],
                    ["Competition", w?.competition],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <span>{String(label)}</span>
                      <b>
                        {Number(value) > 0.65
                          ? "Abundant"
                          : Number(value) > 0.35
                            ? "Moderate"
                            : "Scarce"}
                      </b>
                    </div>
                  ))}
                </div>
                <p className="small muted">
                  Coarse local ecological indicators, not exact organism counts.
                </p>
                <h3>Continuing situations</h3>
                {w?.situations
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <article className="ongoing-situation" key={s.id}>
                      <b>{s.kind.replaceAll("-", " ")}</b>
                      <p>{s.cause}</p>
                      <small>
                        {s.days} days · Began {formatDate(s.began)} · Responses{" "}
                        {s.involvement}
                      </small>
                    </article>
                  ))}
                {!w?.situations.some((s) => s.status === "active") && (
                  <p>No major continuing situation is apparent.</p>
                )}
              </div>
            </details>
            <details className="game-drawer">
              <summary>
                <span>Condition & experience</span>
                <small>
                  Stress {Math.round(a.stats.stress)} · Injury{" "}
                  {Math.round(a.stats.injury)}
                </small>
              </summary>
              <div className="drawer-content">
                <Meter label="Stress" value={a.stats.stress} reverse />
                <Meter label="Injury" value={a.stats.injury} reverse />
                <p>{sp.challenge}</p>
                <p>
                  Foraging experience: {Math.round(a.experience?.foraging ?? 0)}{" "}
                  · Habitat knowledge:{" "}
                  {Math.round(a.experience?.habitatKnowledge ?? 0)}
                </p>
                <button className="text-button" onClick={onGuide}>
                  Read species field guide <Icon name="arrow" size={15} />
                </button>
              </div>
            </details>
            <details className="game-drawer">
              <summary>
                <span>Life Journal</span>
                <small>{journal.length} observations</small>
              </summary>
              <div className="drawer-content">
                {journal
                  .slice(-5)
                  .reverse()
                  .map((e) => (
                    <article className="drawer-journal" key={e.id}>
                      <small>
                        {formatDate(e.date)} · {e.phase}
                      </small>
                      <p>{e.text}</p>
                    </article>
                  ))}
                <button
                  className="text-button"
                  onClick={() => onView("journal")}
                >
                  Open full journal <Icon name="arrow" size={15} />
                </button>
              </div>
            </details>
            <details className="game-drawer">
              <summary>
                <span>Relationships</span>
                <small>Social bond {Math.round(a.stats.bond)}</small>
              </summary>
              <div className="drawer-content">
                <p>{a.circumstances ?? sp.social}</p>
                <p>{sp.social}</p>
                <p>
                  {a.caste
                    ? "Your contribution supports the colony’s shared resources."
                    : `${children.filter((c) => c.alive).length} surviving offspring are recorded.`}
                </p>
              </div>
            </details>
            <details className="game-drawer">
              <summary>
                <span>Family Tree</span>
                <small>Generation {a.generation}</small>
              </summary>
              <div className="drawer-content">
                <p>
                  {a.parentId
                    ? `Child of ${game.family[a.parentId]?.name}`
                    : "A founder at the root of a new bloodline."}
                </p>
                {children.slice(-5).map((child) => (
                  <div className="family-preview" key={child.id}>
                    <b>{child.name}</b>
                    <span>
                      {ageLabel(child.ageDays)} ·{" "}
                      {child.alive ? "Living" : "Deceased"}
                    </span>
                  </div>
                ))}
                <button
                  className="text-button"
                  onClick={() => onView("family")}
                >
                  Open family tree <Icon name="arrow" size={15} />
                </button>
              </div>
            </details>
            <details className="game-drawer time-drawer">
              <summary>
                <span>Time Skip & autonomy</span>
                <small>Every phase is simulated</small>
              </summary>
              <div className="drawer-content">
                <label className="input-label">
                  Autonomous priority
                  <select
                    value={game.priority}
                    onChange={(e) =>
                      onChange({
                        ...game,
                        priority: e.target.value as Priority,
                      })
                    }
                  >
                    {["survival", "feeding", "reproduction", "exploration"].map(
                      (p) => (
                        <option key={p} value={p}>
                          {p[0].toUpperCase() + p.slice(1)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <div className="game-skip-grid">
                  {skipOptions(game).map((n) => (
                    <button
                      className="button subtle"
                      disabled={busy}
                      key={n}
                      onClick={() => onSkip(n)}
                    >
                      {n === 1
                        ? "Next day"
                        : n === 365
                          ? "Skip 1 year"
                          : `Skip ${n} days`}
                    </button>
                  ))}
                </div>
                <p>
                  Routine feeding, weather, ecology and mortality continue.
                  Danger can interrupt a skip; rare opportunities may pass.
                </p>
              </div>
            </details>
          </aside>
        </div>
      </div>
    </main>
  );
}
