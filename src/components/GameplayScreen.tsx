import { useEffect, useRef, useState } from "react";
import { speciesStatus } from "../game/biology";
import { speciesById } from "../data/species";
import {
  PHASES,
  availableActions,
  current,
  skipOptions,
  stageOf,
} from "../game/engine";
import { ageLabel, formatDate } from "../game/calendar";
import {
  encounterResponses,
  interactions,
  locationNow,
  nearby,
  travelEligibility,
  type InteractionId,
  type ResponseId,
} from "../game/wildlife";
import {
  situationText,
  eventText,
  interactionText,
  discoveries,
} from "../game/narration";
import type { GameState, Pacing, Priority } from "../game/types";
import { Icon, Meter } from "./UI";
import { WildlifeScene } from "./WildlifeScene";
import "./Immersive.css";
import "./Wildlife.css";
type View = "journal" | "family" | "collection" | "packs" | "settings" | "menu";
type Tab = "life" | "explore" | "social" | "journal" | "more";
const tabs: Tab[] = ["life", "explore", "social", "journal", "more"];
const fromHash = (): Tab => {
  const part = window.location.hash.split("/")[1] as Tab;
  return tabs.includes(part) ? part : "life";
};
interface Props {
  game: GameState;
  saveStatus: string;
  busy: boolean;
  notice: string;
  onDismiss: () => void;
  onInteract: (id: InteractionId) => void;
  onTravel: (id: string) => void;
  onRespond: (id: ResponseId) => void;
  onMeet: (id: string) => void;
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
  onInteract,
  onTravel,
  onRespond,
  onMeet,
  onSkip,
  onPaced,
  onChange,
  onExit,
  onView,
  onGuide,
}: Props) {
  const a = current(game)!,
    sp = speciesById(a.speciesId),
    node = locationNow(game),
    area = game.area!,
    world = game.world!,
    people = nearby(game),
    journal = game.journal.filter((e) => e.individualId === a.id);
  const [tab, setTab] = useState<Tab>(fromHash),
    [selected, setSelected] = useState(node.id),
    main = useRef<HTMLElement>(null);
  useEffect(() => {
    const restore = () => setTab(fromHash());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [tab]);
  function navigate(next: Tab) {
    setTab(next);
    window.history.pushState(
      null,
      "",
      next === "life" ? "#life" : `#life/${next}`,
    );
  }
  const encounter =
      area.encounter?.status === "active" ? area.encounter : undefined,
    other = area.animals.find((n) => n.id === encounter?.animalId);
  const selectedNode = area.nodes.find((n) => n.id === selected) ?? node,
    route = travelEligibility(game, selectedNode.id),
    patch = world.patches.find((p) => p.id === selectedNode.id)!;
  const options = interactions(game, availableActions(game)).map((o) =>
    interactionText(game, o),
  );
  const latest = area.feedback ?? journal.at(-1)?.text;
  return (
    <main
      ref={main}
      tabIndex={-1}
      className="gameplay-screen wildlife-game"
      aria-label="Active life"
      aria-busy={busy}
    >
      <header className="rpg-topbar">
        <span className="rpg-brand">
          <Icon name="leaf" size={17} /> LOTTERY OF LIFE
        </span>
        <span className="rpg-save">{saveStatus}</span>
        <button onClick={onExit} aria-label="Save & Main Menu">
          <Icon name="home" size={18} />
          <span>Menu</span>
        </button>
      </header>
      <div className="rpg-shell">
        <section className="rpg-identity" aria-label="Animal identity">
          <div>
            <p className="eyebrow">
              {sp.name} · {a.caste ?? a.sex}
            </p>
            <h1>
              {a.name}
              <span>
                {stageOf(a).name} · {ageLabel(a.ageDays)}
              </span>
            </h1>
          </div>
          <div className="rpg-date">
            <b>{formatDate(game.date)}</b>
            <span>
              Generation {a.generation} · Day {a.ageDays + 1}
            </span>
          </div>
        </section>
        {notice && (
          <div className="rpg-notice" role="status">
            <p>{notice}</p>
            <button onClick={onDismiss} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
        {tab === "life" && (
          <div className="rpg-life-layout">
            <div className="rpg-scene-column">
              <WildlifeScene game={game} />
              <div className="rpg-phase-row">
                <ol aria-label="Day phases">
                  {PHASES.map((p, i) => (
                    <li
                      key={p}
                      aria-current={i === game.phase ? "step" : undefined}
                    >
                      <span />
                      {p}
                    </li>
                  ))}
                </ol>
                <span>{world.season}</span>
              </div>
              <section className="rpg-vitals" aria-label="Survival condition">
                <Meter label="Health" value={a.stats.health} />
                <Meter label="Hunger" value={a.stats.hunger} reverse />
                <Meter label="Hydration" value={a.stats.hydration} />
                <Meter label="Energy" value={a.stats.energy} />
              </section>
              <p className="rpg-nearby">
                {people.length
                  ? `${people
                      .map((n) => n.name)
                      .slice(0, 3)
                      .join(" · ")} nearby`
                  : "For the moment, you are alone here."}
                <button onClick={() => navigate("social")}>
                  Social <Icon name="arrow" size={13} />
                </button>
              </p>
            </div>
            <div className="rpg-play-column">
              <section className="rpg-situation">
                <p className="eyebrow">HERE & NOW</p>
                <h2>
                  {stageOf(a).dependent
                    ? "A world much larger than you."
                    : node.kind === "boundary"
                      ? "At the edge of familiar ground."
                      : "A life in motion."}
                </h2>
                <p>{situationText(game)}</p>
              </section>
              {encounter && other ? (
                <section
                  className={`rpg-encounter ${encounter.kind}`}
                  aria-label="Current encounter"
                >
                  <p className="eyebrow">
                    {encounter.kind === "companion"
                      ? "A QUIET ENCOUNTER"
                      : "AN ENCOUNTER"}
                  </p>
                  <h2>{other.name}</h2>
                  <p>
                    {other.species} · {other.stage.toLowerCase()} ·{" "}
                    {other.health < 50 ? "Wounded or weakened" : "Alert"}.{" "}
                    {encounter.kind === "predator"
                      ? "A predator is close. Distance and cover matter."
                      : encounter.kind === "rival"
                        ? "Your presence draws their attention. Conflict can leave lasting injuries."
                        : encounter.kind === "prey"
                          ? "A feeding opportunity, with no guarantee of success."
                          : "You share this place for a moment."}
                  </p>
                  <div className="rpg-choices">
                    {encounterResponses(game).map((r) => (
                      <button
                        disabled={busy}
                        key={r.id}
                        onClick={() => onRespond(r.id)}
                      >
                        {r.title}
                        <Icon name="arrow" size={15} />
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <section
                  className="rpg-decisions"
                  aria-labelledby="decision-title"
                >
                  <div className="rpg-section-heading">
                    <h2 id="decision-title">What will you do?</h2>
                    <span>One phase passes</span>
                  </div>
                  <div className="rpg-choices">
                    {options.map((o) => (
                      <button
                        className="game-action"
                        key={o.id}
                        title={o.detail}
                        disabled={busy}
                        onClick={() => onInteract(o.id)}
                      >
                        <span className="action-symbol" aria-hidden="true">
                          {actionSymbol(o.id)}
                        </span>
                        <span>
                          <b>{o.title}</b>
                          <small>{o.detail}</small>
                        </span>
                        <Icon name="arrow" size={16} />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {latest && journal.at(-1)?.kind !== "birth" && (
                <div className="rpg-feedback" role="status">
                  <span>THE LAST MOMENT</span>
                  <p>{eventText(latest, game.narration)}</p>
                </div>
              )}
              <button className="rpg-routine" onClick={onPaced} disabled={busy}>
                {" "}
                {stageOf(a).dependent
                  ? "Advance routine care"
                  : "Let life unfold"}{" "}
                <span>
                  {game.pacing === "immersive"
                    ? "One phase"
                    : game.pacing === "balanced"
                      ? "Balanced pace"
                      : "Story pace"}
                </span>
                <Icon name="arrow" size={16} />
              </button>
              <details className="rpg-condition">
                <summary>Condition & experience</summary>
                <p>{speciesStatus(game)}</p>
                <p>
                  Stress {Math.round(a.stats.stress)} · Injury{" "}
                  {Math.round(a.stats.injury)} · Social bond{" "}
                  {Math.round(a.stats.bond)}
                </p>
                <p>
                  Foraging {Math.round(a.experience?.foraging ?? 0)} · Habitat
                  knowledge {Math.round(a.experience?.habitatKnowledge ?? 0)}
                </p>
                <button onClick={onGuide}>Species field guide</button>
              </details>
            </div>
          </div>
        )}
        {tab === "explore" && (
          <section
            className="rpg-explore"
            aria-label="Explore nearby locations"
          >
            <div className="rpg-view-heading">
              <p className="eyebrow">YOUR LOCAL WORLD</p>
              <h2>Every path has a cost.</h2>
              <p>
                {game.environment!.location.region} ·{" "}
                {game.environment!.location.habitat}.{" "}
                {stageOf(a).dependent
                  ? "You still depend on others. Accessible paths reflect your development."
                  : "Choose a connected location to travel."}
              </p>
            </div>
            <div className="rpg-map-layout">
              <div className="rpg-map" aria-label="Connected location map">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {area.nodes.flatMap((n) =>
                    n.links
                      .filter((id) => id > n.id)
                      .map((id) => {
                        const end = area.nodes.find((x) => x.id === id)!;
                        return (
                          <line
                            key={`${n.id}-${id}`}
                            x1={n.x}
                            y1={n.y}
                            x2={end.x}
                            y2={end.y}
                          />
                        );
                      }),
                  )}
                </svg>
                {area.nodes.map((n) => (
                  <button
                    key={n.id}
                    className={`${n.id === node.id ? "here" : ""} ${n.id === selected ? "selected" : ""}`}
                    style={{ left: `${n.x}%`, top: `${n.y}%` }}
                    aria-pressed={selected === n.id}
                    onClick={() => setSelected(n.id)}
                  >
                    <span>
                      {n.kind === "water"
                        ? "≈"
                        : n.kind === "home"
                          ? "⌂"
                          : n.kind === "boundary"
                            ? "◇"
                            : "♧"}
                    </span>
                    <b>{n.label}</b>
                    {n.id === node.id && <small>You are here</small>}
                  </button>
                ))}
              </div>
              <div className="rpg-location-detail">
                <p className="eyebrow">
                  {selectedNode.kind === "boundary"
                    ? "EXPOSED GROUND"
                    : "LOCAL HABITAT"}
                </p>
                <h2>{selectedNode.label}</h2>
                <div className="rpg-resource-list">
                  <span>
                    Food{" "}
                    <b>
                      {patch.food > 0.65
                        ? "Plentiful"
                        : patch.food > 0.3
                          ? "Limited"
                          : "Depleted"}
                    </b>
                  </span>
                  <span>
                    Water{" "}
                    <b>
                      {patch.water > 0.6
                        ? "Available"
                        : patch.water > 0.25
                          ? "Limited"
                          : "Scarce"}
                    </b>
                  </span>
                  <span>
                    Cover <b>{patch.cover > 0.6 ? "Sheltered" : "Exposed"}</b>
                  </span>
                  <span>
                    Predator risk{" "}
                    <b>
                      {selectedNode.exposure * world.predators > 0.25
                        ? "Elevated"
                        : "Lower"}
                    </b>
                  </span>
                  <span>
                    Temperature{" "}
                    <b>
                      {Math.round(
                        game.environment!.temperature +
                          selectedNode.temperatureOffset,
                      )}
                      °C
                    </b>
                  </span>
                </div>
                <p>
                  {area.animals
                    .filter((n) => n.alive && n.location === selectedNode.id)
                    .map((n) => n.name)
                    .join(" · ") || "No identified animals here."}
                </p>
                <p>{route.reason}</p>
                {node.id !== selectedNode.id && (
                  <button
                    className="button primary"
                    disabled={busy || !route.allowed}
                    onClick={() => {
                      onTravel(selectedNode.id);
                      navigate("life");
                    }}
                  >
                    {route.escorted ? "Follow family" : "Travel here"} ·{" "}
                    {route.phases} phase{route.phases === 1 ? "" : "s"} ·{" "}
                    {route.energy} energy + metabolism
                  </button>
                )}
              </div>
            </div>
            <details className="rpg-condition">
              <summary>Local world</summary>
              <h3>Continuing situations</h3>
              {world.situations
                .filter((x) => x.status === "active")
                .map((x) => (
                  <p key={x.id}>
                    <b>{x.kind.replaceAll("-", " ")}</b>: {x.cause} {x.days}{" "}
                    days.
                  </p>
                ))}
              {!world.situations.some((x) => x.status === "active") && (
                <p>No major continuing situation is apparent.</p>
              )}
              <p>{game.environment!.history?.description}</p>
            </details>
          </section>
        )}
        {tab === "social" && (
          <section aria-label="Social world">
            <div className="rpg-view-heading">
              <p className="eyebrow">FAMILIAR LIVES</p>
              <h2>No life unfolds alone.</h2>
              <p>
                Individuals have their own needs, movement and mortality. Your
                relationships survive each phase.
              </p>
            </div>
            <div className="rpg-social-list">
              {area.animals.map((n) => (
                <article key={n.id} className={!n.alive ? "deceased" : ""}>
                  <span className="rpg-animal-initial" aria-hidden="true">
                    {n.name[0]}
                  </span>
                  <div>
                    <h3>
                      {n.name}
                      <small>{n.role}</small>
                    </h3>
                    <p>
                      {n.species} · {n.stage} · {ageLabel(n.ageDays)}
                    </p>
                    <p>
                      {n.alive
                        ? `${area.nodes.find((x) => x.id === n.location)?.label} · ${n.health < 50 ? "Weakened" : n.injury > 0 ? "Injured" : "Healthy"} · ${n.priority === "protect" ? "Staying near family" : n.priority === "feed" ? "Seeking food" : n.priority === "rest" ? "Resting" : "Moving through the habitat"}`
                        : "Died in this local world"}
                    </p>
                    <span className="rpg-bond">
                      Trust {Math.round(n.bond)} · {n.offspring} local cohorts
                    </span>
                  </div>
                  {n.alive && n.location === node.id && (
                    <button
                      aria-label={`Meet ${n.name}`}
                      onClick={() => {
                        onMeet(n.id);
                        navigate("life");
                      }}
                    >
                      Meet <Icon name="arrow" size={15} />
                    </button>
                  )}
                </article>
              ))}
            </div>
            <button className="rpg-link" onClick={() => onView("family")}>
              Open bloodline & family records <Icon name="tree" size={16} />
            </button>
          </section>
        )}
        {tab === "journal" && (
          <section aria-label="Life Journal">
            <div className="rpg-view-heading">
              <p className="eyebrow">A LIFE, REMEMBERED</p>
              <h2>The days leave their marks.</h2>
              <p>
                {a.name} · Generation {a.generation}
              </p>
            </div>
            <div className="rpg-journal">
              {[...journal].reverse().map((e) => (
                <article key={e.id} className={e.kind}>
                  <span>
                    {formatDate(e.date)} · {e.phase} · {ageLabel(e.age)}
                  </span>
                  <p>{eventText(e.text, game.narration)}</p>
                </article>
              ))}
            </div>
            <button className="rpg-link" onClick={() => onView("journal")}>
              Open historical records <Icon name="book" size={16} />
            </button>
          </section>
        )}
        {tab === "more" && (
          <section className="rpg-more" aria-label="More gameplay options">
            <div className="rpg-view-heading">
              <p className="eyebrow">THE WIDER STORY</p>
              <h2>Choose the rhythm of your life.</h2>
            </div>
            <section className="rpg-time" aria-label="Time Skip & autonomy">
              <label>
                Your pace
                <select
                  aria-label="Your pace"
                  value={game.pacing}
                  onChange={(e) =>
                    onChange({ ...game, pacing: e.target.value as Pacing })
                  }
                >
                  <option value="immersive">Immersive</option>
                  <option value="balanced">Balanced</option>
                  <option value="story">Story Focus</option>
                </select>
              </label>
              <label>
                Narration
                <select
                  aria-label="Narration"
                  value={game.narration}
                  onChange={(e) =>
                    onChange({
                      ...game,
                      narration: e.target.value as GameState["narration"],
                    })
                  }
                >
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                </select>
              </label>
              <p>
                Simple uses short explanations. Detailed adds ecological
                context. Both play by exactly the same rules.
              </p>
              <p>
                Quiet phases can pass automatically. Important encounters,
                development and serious danger pause adaptive pacing. Every
                phase uses the same survival rules.
              </p>
              <label>
                Autonomous priority
                <select
                  value={game.priority}
                  onChange={(e) =>
                    onChange({ ...game, priority: e.target.value as Priority })
                  }
                >
                  {["survival", "feeding", "reproduction", "exploration"].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <div className="rpg-skip">
                {skipOptions(game).map((n) => (
                  <button
                    disabled={busy}
                    className="button subtle"
                    key={n}
                    onClick={() => onSkip(n)}
                  >
                    {n === 1 ? "Next day" : `Skip ${n} days`}
                  </button>
                ))}
              </div>
            </section>
            <div className="rpg-secondary-links">
              {(
                [
                  ["collection", "Species collection", "grid"],
                  ["packs", `${game.coins} Coins · Field packs`, "pack"],
                  ["family", "Bloodlines & family", "tree"],
                  ["settings", "Settings & saves", "settings"],
                ] as const
              ).map(([v, label, icon]) => (
                <button key={v} onClick={() => onView(v)}>
                  <Icon name={icon} />
                  {label}
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
            <details className="rpg-discovery">
              <summary>Discover this species · optional field notes</summary>
              {discoveries(game).map((d) => (
                <article key={d.topic}>
                  <h3>{d.topic}</h3>
                  <p>{eventText(d.fact, game.narration)}</p>
                </article>
              ))}
              <small>
                Species reference:{" "}
                <a href={sp.source} target="_blank" rel="noreferrer">
                  {sp.name} field source
                </a>
                . Historical context uses approximate ranges; see the field
                guide for model notes.
              </small>
              <button className="rpg-link" onClick={onGuide}>
                Open the full species field guide
              </button>
            </details>
            <p className="rpg-credit">Created by Quentin Warminsky</p>
          </section>
        )}
      </div>
      <nav className="rpg-nav" aria-label="Gameplay navigation">
        {tabs.map((t, i) => (
          <button
            key={t}
            aria-label={t[0].toUpperCase() + t.slice(1)}
            aria-current={tab === t ? "page" : undefined}
            onClick={() => navigate(t)}
          >
            <Icon
              name={["leaf", "grid", "tree", "book", "settings"][i]}
              size={21}
            />
            <span>{t[0].toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function actionSymbol(id: string) {
  const key = id.replace("biology:", "");
  if (
    [
      "nurse",
      "feed",
      "cut-leaves",
      "collect-pollen",
      "pack-hunt",
      "dabble",
      "dig-prey",
      "graze-algae",
      "ambush",
      "probe-shallows",
      "gather-fruit",
      "listen-pounce",
      "build-reserves",
      "shallow-dive",
      "deep-dive",
      "recover-cache",
    ].includes(key)
  )
    return "◈";
  if (["drink", "dig-water", "wallow", "moisten-skin"].includes(key))
    return "≈";
  if (["rest", "recover-dive", "sheltered-roost", "digest-fiber"].includes(key))
    return "☾";
  if (
    [
      "follow-group",
      "track-prey",
      "explore",
      "learn-water",
      "learn-route",
    ].includes(key)
  )
    return "↗";
  if (
    [
      "groom",
      "stay-close",
      "care",
      "rally-pack",
      "help-pups",
      "deliver-pollen",
    ].includes(key)
  )
    return "♡";
  if (key === "sing") return "♫";
  if (["blend-in", "sentinel"].includes(key)) return "◌";
  return "⌂";
}
