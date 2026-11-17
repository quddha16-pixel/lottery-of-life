import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SCENARIOS, SPECIES, speciesById } from "./data/species";
import {
  ACTIONS,
  PACK,
  PHASES,
  abandonLife,
  act,
  actionTitle,
  advanceDays,
  availableActions,
  continueBloodline,
  createGame,
  current,
  openPack,
  skipOptions,
  stageOf,
  startLife,
} from "./game/engine";
import { ageLabel, formatDate } from "./game/calendar";
import {
  BACKUP_KEY,
  SAVE_KEY,
  deserialize,
  loadGame,
  persistGame,
  serialize,
} from "./game/storage";
import type {
  GameState,
  Individual,
  Priority,
  Species,
  Stats,
} from "./game/types";
import credits from "./data/image-credits.json";
import "./App.css";

// All replaceable product naming lives here.
const BRAND = {
  title: "Life Simulator",
  subtitle: "A natural history of you",
  edition: "Field edition · Phase 01",
};
type Screen =
  | "menu"
  | "birth"
  | "life"
  | "journal"
  | "collection"
  | "packs"
  | "family"
  | "summary"
  | "settings";
const navigation: { id: Screen; label: string; icon: string }[] = [
  { id: "menu", label: "Overview", icon: "home" },
  { id: "life", label: "Your life", icon: "leaf" },
  { id: "journal", label: "Journal", icon: "book" },
  { id: "collection", label: "Species", icon: "grid" },
  { id: "packs", label: "Field packs", icon: "pack" },
  { id: "family", label: "Bloodline", icon: "tree" },
];
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C8 1 1 8 6 16c8 5 16-2 14-13Z" />
        <path d="m3 21 12-12M9 15v-5m0 5h5" />
      </>
    ),
    book: (
      <>
        <path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Z" />
        <path d="M12 5v15" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    pack: (
      <>
        <path d="m4 7 8-4 8 4v12l-8 3-8-3Zm0 0 8 4 8-4M12 11v11M8 5l8 4" />
      </>
    ),
    tree: (
      <>
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <path d="M12 8v5H5v3m7-3h7v3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="m9 3 1-2h4l1 2 3 2h3l2 4-2 2v3l1 3-3 3-3-1-3 2-3-1-3 1-3-3 1-3-2-3 1-3 3-1Z" />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.leaf}
    </svg>
  );
}
function Photo({
  species,
  className = "",
}: {
  species: Species;
  className?: string;
}) {
  const credit = credits.find((c) => c.id === species.id && !("error" in c));
  return credit ? (
    <img
      className={`species-photo ${className}`}
      src={`${import.meta.env.BASE_URL}species/${species.id}.jpg`}
      alt={species.name}
    />
  ) : (
    <div className={`photo-fallback ${className}`}>
      <Icon name="leaf" size={80} />
      <span>{species.name}</span>
    </div>
  );
}
function Tag({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function SectionTitle({
  eyebrow,
  title,
  detail,
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {detail && <p className="muted">{detail}</p>}
      </div>
      {children}
    </div>
  );
}
function Meter({
  label,
  value,
  reverse = false,
}: {
  label: string;
  value: number;
  reverse?: boolean;
}) {
  const warning = (reverse ? 100 - value : value) < 30;
  return (
    <div className={`meter ${warning ? "warning" : ""}`}>
      <div>
        <span>{label}</span>
        <b>
          {Math.round(value)}
          <small>/100</small>
        </b>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
function App() {
  const [loaded] = useState(() => {
    try {
      return loadGame(localStorage);
    } catch {
      return {
        warning: "Storage is unavailable; export to preserve your progress.",
        blocked: true,
      };
    }
  });
  const [game, setGame] = useState<GameState>(
    () => loaded.state ?? createGame(),
  );
  const [screen, setScreen] = useState<Screen>("menu");
  const [notice, setNotice] = useState(loaded.warning ?? "");
  const [saveBlocked, setSaveBlocked] = useState(!!loaded.blocked);
  const [saveStatus, setSaveStatus] = useState(
    loaded.blocked ? "Autosave paused" : "Saved on this device",
  );
  const [mode, setMode] = useState<"random" | "manual">("random");
  const [selectedSpecies, setSelectedSpecies] = useState("wolf");
  const [scenario, setScenario] = useState("2020");
  const [seed, setSeed] = useState(
    () => `field-${Math.floor(Date.now() / 1000)}`,
  );
  const [revealed, setRevealed] = useState(false);
  const [inspect, setInspect] = useState<Species | null>(null);
  const [filter, setFilter] = useState("all");
  const [importText, setImportText] = useState("");
  const [confirm, setConfirm] = useState<"reset" | "abandon" | "import" | null>(
    null,
  );
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const a = current(game);
  const sp = a ? speciesById(a.speciesId) : speciesById("wolf");

  // Browser-storage completion/failure is external state, so report it from this effect.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (saveBlocked) return;
    try {
      persistGame(game, localStorage);
      setSaveStatus("Saved on this device");
    } catch {
      setSaveStatus("Save failed");
      setNotice(
        "Could not save to browser storage. Export a backup in Settings before leaving.",
      );
      setSaveBlocked(true);
    }
  }, [game, saveBlocked]);
  /* oxlint-enable react/set-state-in-effect */
  useEffect(() => {
    mainRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);
  useEffect(() => {
    if (!inspect && !confirm) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(
      "[role=dialog], [role=alertdialog]",
    );
    if (!dialog) return;
    const focusable = () => [
      ...dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
      ),
    ];
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspect(null);
        setConfirm(null);
      }
      if (event.key !== "Tab") return;
      const elements = focusable(),
        first = elements[0],
        last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [inspect, confirm]);
  function navigate(to: Screen) {
    setScreen(to);
    setInspect(null);
  }
  function update(next: GameState) {
    setGame(next);
    if (current(game)?.alive && !current(next)?.alive) {
      setSelectedRecord(current(next)!.id);
      navigate("summary");
    }
  }
  function attempt(fn: () => void) {
    try {
      fn();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  }
  function doSkip(days: number) {
    setBusy(true);
    // Yield so long skips show a busy state before deterministic simulation.
    window.setTimeout(
      () =>
        attempt(() => {
          try {
            const result = advanceDays(game, days);
            update(result.state);
            setNotice(
              `${result.phases} phases resolved.${result.interrupted ? " The skip stopped for a serious danger or death." : " Significant events are recorded in the journal."}`,
            );
          } finally {
            setBusy(false);
          }
        }),
      20,
    );
  }
  function exportSave() {
    const blob = new Blob([serialize(game)], { type: "application/json" });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "life-simulator-save.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function commitConfirmation() {
    attempt(() => {
      if (confirm === "reset") {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        setGame(createGame());
        setSaveBlocked(false);
        setRevealed(false);
        setSelectedRecord(null);
        navigate("menu");
        setNotice("A fresh field notebook. All local progress has been reset.");
      } else if (confirm === "abandon") {
        update(abandonLife(game));
        setNotice(
          "Life archived without Coins. Collection progress is preserved.",
        );
      } else if (confirm === "import") {
        const imported = deserialize(importText);
        persistGame(imported, localStorage);
        setGame(imported);
        setSaveBlocked(false);
        setImportText("");
        setRevealed(false);
        navigate("menu");
        setNotice("Backup imported and saved successfully.");
      }
      setConfirm(null);
    });
  }
  const record =
    game.records.find((r) => r.individualId === selectedRecord) ??
    game.records.at(-1);
  const lifeJournal = game.journal.filter((e) => e.individualId === a?.id);
  const navLabel =
    screen === "birth"
      ? "Birth generator"
      : screen === "summary"
        ? "Lifetime record"
        : screen === "settings"
          ? "Settings"
          : navigation.find((n) => n.id === screen)?.label;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("menu")}
          aria-label="Life Simulator overview"
        >
          <span className="brand-mark">
            <Icon name="leaf" size={29} />
          </span>
          <span>
            {BRAND.title}
            <small>{BRAND.subtitle}</small>
          </span>
        </button>
        <p className="rail-label">YOUR FIELD NOTEBOOK</p>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <button
              key={n.id}
              aria-label={n.label}
              className={`nav-item ${screen === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.id === "collection" && <small>{game.unlocked.length}</small>}
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <div className="edition">
            <span className="status-dot" /> {BRAND.edition}
            <p>Every life leaves a trace.</p>
          </div>
          <button
            className={`nav-item ${screen === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" />
            <span>Settings & saves</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            FIELD NOTEBOOK <span>/</span> <b>{navLabel}</b>
          </div>
          <div className="topbar-right">
            <span className="save-indicator">
              <i className={saveBlocked ? "unsaved" : ""} />
              {saveStatus}
            </span>
            <button
              className="coin-balance"
              onClick={() => navigate("packs")}
              aria-label={`${game.coins} Coins, open field packs`}
            >
              <Icon name="coin" size={18} />
              {game.coins}
              <span>Coins</span>
            </button>
            <button
              className="mobile-settings icon-button"
              aria-label="Settings"
              onClick={() => navigate("settings")}
            >
              <Icon name="settings" />
            </button>
          </div>
        </header>
        <main
          ref={mainRef}
          tabIndex={-1}
          className="main-content"
          id="main-content"
          aria-busy={busy}
        >
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {screen === "menu" && (
            <>
              <SectionTitle
                eyebrow="THE LIVING WORLD AWAITS"
                title="One world. Countless lives."
                detail="A life is not measured in years, but in the days you survive."
              />
              <section className="hero">
                <Photo species={speciesById("wolf")} />
                <div className="hero-shade" />
                <div className="hero-content">
                  <Tag tone="gold">THE NEXT CHAPTER IS YOURS</Tag>
                  <h2>
                    You don’t choose
                    <br />
                    where life begins.
                  </h2>
                  <p>
                    A woodland. A warren. A world beneath the tide.
                    <br />
                    Find your place in the extraordinary story of life.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate(a?.alive ? "life" : "birth")}
                  >
                    {a?.alive ? "Continue your life" : "Begin a new life"}
                    <Icon name="arrow" />
                  </button>
                  <span className="hero-caption">
                    10 starting species · A different perspective every time
                  </span>
                </div>
                <div className="photo-label">
                  <span>FIELD OBSERVATION 004</span>
                  <b>Canis lupus</b>
                  <small>Temperate woodland · Europe</small>
                </div>
              </section>
              <div className="overview-stats">
                <div>
                  <Icon name="grid" />
                  <b>
                    {game.unlocked.length}
                    <span>of {SPECIES.length} species</span>
                  </b>
                  <small>Your living collection</small>
                </div>
                <div>
                  <Icon name="book" />
                  <b>
                    {game.records.length}
                    <span>completed lives</span>
                  </b>
                  <small>Every ending tells a story</small>
                </div>
                <div>
                  <Icon name="tree" />
                  <b>
                    {Math.max(
                      0,
                      ...Object.values(game.family).map((i) => i.generation),
                    )}
                    <span>generations</span>
                  </b>
                  <small>A history written together</small>
                </div>
              </div>
              <div className="section-heading compact">
                <div>
                  <p className="eyebrow">MANY WAYS TO BE ALIVE</p>
                  <h2>A few lives you could lead</h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => navigate("collection")}
                >
                  Explore the collection <Icon name="arrow" size={17} />
                </button>
              </div>
              <div className="featured-species">
                {["bumblebee", "elephant", "octopus"].map((id) => {
                  const species = speciesById(id);
                  return (
                    <button
                      className="featured-card"
                      key={id}
                      onClick={() => setInspect(species)}
                    >
                      <Photo species={species} />
                      <div>
                        <span>{species.group.split(" · ")[0]}</span>
                        <h3>{species.name}</h3>
                        <i>{species.scientific}</i>
                      </div>
                      <span className="card-arrow">
                        <Icon name="arrow" size={14} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="field-note">
                <Icon name="leaf" />
                <p>
                  <b>Nature makes no promises.</b> Each decision takes one phase
                  of the day. Rest, feed, find shelter — and live with the
                  consequences.
                </p>
                <span>FIELD NOTE № 01</span>
              </div>
              {game.records.length > 0 && (
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedRecord(null);
                    navigate("summary");
                  }}
                >
                  Read your latest lifetime record{" "}
                  <Icon name="arrow" size={16} />
                </button>
              )}
            </>
          )}
          {screen === "birth" && (
            <>
              <SectionTitle
                eyebrow="A NEW PERSPECTIVE"
                title={
                  revealed && a
                    ? "Your story begins here."
                    : "The lottery of life."
                }
                detail="A species. A place. A moment in history. A life that has never existed before."
              />
              {a?.alive && !revealed ? (
                <div className="panel empty">
                  <Icon name="leaf" size={42} />
                  <h2>A life is already unfolding.</h2>
                  <p>
                    Continue as {a.name}, or archive this life in Settings
                    before beginning another.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate("life")}
                  >
                    Return to your life
                  </button>
                </div>
              ) : revealed && a ? (
                <div className="birth-layout">
                  <div className="birth-portrait">
                    <Photo species={sp} />
                    <div>
                      <Tag tone="gold">
                        GENERATION {a.generation.toString().padStart(2, "0")}
                      </Tag>
                      <h2>{a.name}</h2>
                      <i>{sp.scientific}</i>
                    </div>
                  </div>
                  <section className="panel birth-result">
                    <p className="eyebrow">YOUR BIRTH RECORD</p>
                    {[
                      ["01", "Species", `${sp.name} · ${a.caste ?? a.sex}`],
                      [
                        "02",
                        "Birthplace",
                        `${game.environment!.location.place} · ${game.environment!.location.continent}`,
                      ],
                      ["03", "Birth date", formatDate(a.birth)],
                      [
                        "04",
                        "Individual",
                        `${stageOf(a).name} · Resilience ${Math.round(a.traits.resilience)} · ${sp.social}`,
                      ],
                    ].map(([n, label, value]) => (
                      <div className="birth-step" key={n}>
                        <span>{n}</span>
                        <div>
                          <small>{label}</small>
                          <p>{value}</p>
                        </div>
                      </div>
                    ))}
                    <p className="muted small">{sp.challenge}</p>
                    <button
                      className="button primary full"
                      onClick={() => {
                        setRevealed(false);
                        navigate("life");
                      }}
                    >
                      Enter this life <Icon name="arrow" />
                    </button>
                  </section>
                </div>
              ) : (
                <div className="birth-layout">
                  <section className="panel generator">
                    <div className="section-heading compact">
                      <h2>Let nature decide.</h2>
                      <Tag>SEEDED GENERATION</Tag>
                    </div>
                    <label className="field-label">01 / YOUR SPECIES</label>
                    <div className="segmented">
                      <button
                        className={mode === "random" ? "selected" : ""}
                        onClick={() => setMode("random")}
                      >
                        Random birth
                      </button>
                      <button
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
                          value={selectedSpecies}
                          onChange={(e) => setSelectedSpecies(e.target.value)}
                        >
                          {SPECIES.filter((s) =>
                            game.unlocked.includes(s.id),
                          ).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p className="muted small">
                        An equal chance of any of your {game.unlocked.length}{" "}
                        unlocked species. Future discoveries join this pool
                        automatically.
                      </p>
                    )}
                    <label className="field-label">
                      02 / HISTORICAL SETTING
                    </label>
                    <div className="scenario-list">
                      {SCENARIOS.map((s) => (
                        <label
                          className={`scenario ${scenario === s.id ? "selected" : ""}`}
                          key={s.id}
                        >
                          <input
                            type="radio"
                            name="scenario"
                            value={s.id}
                            checked={scenario === s.id}
                            onChange={() => setScenario(s.id)}
                          />
                          <span>
                            <b>{s.year}</b>
                            <strong>{s.title}</strong>
                            <small>{s.description}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    <label className="input-label">
                      03 / WORLD SEED
                      <input
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        maxLength={100}
                      />
                    </label>
                    <p className="muted small">
                      The same seed and choices produce the same beginning and
                      random sequence.
                    </p>
                    <button
                      className="button primary full"
                      disabled={!seed.trim()}
                      onClick={() =>
                        attempt(() => {
                          const next = startLife(game, {
                            speciesId:
                              mode === "manual" ? selectedSpecies : undefined,
                            scenarioId: scenario,
                            seed,
                          });
                          setGame(next);
                          setRevealed(true);
                        })
                      }
                    >
                      Draw a life <Icon name="arrow" />
                    </button>
                  </section>
                  <div className="birth-portrait">
                    <Photo
                      species={speciesById(
                        mode === "manual" ? selectedSpecies : "wolf",
                      )}
                    />
                    <div>
                      <Tag tone="gold">NO TWO LIVES ARE THE SAME</Tag>
                      <h2>
                        {mode === "manual"
                          ? speciesById(selectedSpecies).name
                          : "Born into the wild."}
                      </h2>
                      <p>
                        Geography and biology set the stage.
                        <br />
                        What happens next is up to you — and nature.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {screen === "life" &&
            (!a ? (
              <Empty
                title="Every life begins somewhere."
                detail="Draw your first life to enter the living world."
                button="Begin a new life"
                onClick={() => navigate("birth")}
              />
            ) : !a.alive ? (
              <Empty
                title="This life has ended."
                detail="Death is permanent. Your collection and family history remain."
                button="Read lifetime summary"
                onClick={() => {
                  setSelectedRecord(a.id);
                  navigate("summary");
                }}
              />
            ) : (
              <>
                <SectionTitle
                  eyebrow={`GENERATION ${a.generation.toString().padStart(2, "0")} · ${SCENARIOS.find((s) => s.id === game.environment?.scenarioId)?.title.toUpperCase()}`}
                  title={`A day in the life of ${a.name}.`}
                  detail={`${formatDate(game.date)} · ${game.environment!.location.place}`}
                >
                  <Tag tone="green">
                    <span className="status-dot" /> ALIVE
                  </Tag>
                </SectionTitle>
                <div className="life-layout">
                  <aside className="individual-column">
                    <div className="individual-card">
                      <div className="individual-image">
                        <Photo species={sp} />
                        <Tag tone="gold">{sp.rarity.toUpperCase()}</Tag>
                      </div>
                      <div className="individual-details">
                        <span className="eyebrow">{sp.group}</span>
                        <h2>{sp.name}</h2>
                        <i>{sp.scientific}</i>
                        <div className="identity-grid">
                          <div>
                            <small>AGE</small>
                            <b>{ageLabel(a.ageDays)}</b>
                          </div>
                          <div>
                            <small>LIFE STAGE</small>
                            <b>{stageOf(a).name}</b>
                          </div>
                          <div>
                            <small>SEX / ROLE</small>
                            <b>{a.caste ?? a.sex}</b>
                          </div>
                          <div>
                            <small>ACTIVITY</small>
                            <b>{sp.active}</b>
                          </div>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => setInspect(sp)}
                        >
                          Species field guide{" "}
                          <span>
                            <Icon name="arrow" size={14} />
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="panel environment">
                      <span className="eyebrow">AROUND YOU</span>
                      <h3>{game.environment!.location.habitat}</h3>
                      <div>
                        <span>{game.environment!.weather}</span>
                        <b>{Math.round(game.environment!.temperature)}°C</b>
                      </div>
                      <div>
                        <span>Food availability</span>
                        <b>{Math.round(game.environment!.food * 100)}%</b>
                      </div>
                      <div>
                        <span>Social bond</span>
                        <b>{Math.round(a.stats.bond)}/100</b>
                      </div>
                      <p className="muted small">
                        Watch for {sp.predators.join(" and ").toLowerCase()}.{" "}
                        {sp.challenge}
                      </p>
                    </div>
                  </aside>
                  <div className="daily-column">
                    <section className="panel vitals">
                      <div className="section-heading compact">
                        <h2>Condition</h2>
                        <span className="muted small">
                          Every choice has a cost
                        </span>
                      </div>
                      <div className="meters">
                        {(
                          [
                            ["health", "Health"],
                            ["energy", "Energy"],
                            ["hunger", "Hunger"],
                            ["hydration", "Hydration"],
                            ["stress", "Stress"],
                            ["injury", "Injury"],
                          ] as [keyof Stats, string][]
                        ).map(([key, label]) => (
                          <Meter
                            key={key}
                            label={label}
                            value={a.stats[key]}
                            reverse={["hunger", "stress", "injury"].includes(
                              key,
                            )}
                          />
                        ))}
                      </div>
                    </section>
                    <section className="panel decision-panel">
                      <div className="phase-track" aria-label="Day phases">
                        {PHASES.map((phase, index) => (
                          <div
                            key={phase}
                            className={`${index === game.phase ? "current" : ""} ${index < game.phase ? "past" : ""}`}
                            aria-current={
                              index === game.phase ? "step" : undefined
                            }
                          >
                            <span>{["◒", "☀", "◓", "☾"][index]}</span>
                            <b>{phase}</b>
                            <small>
                              {index === game.phase
                                ? "NOW"
                                : index < game.phase
                                  ? "COMPLETE"
                                  : "AHEAD"}
                            </small>
                          </div>
                        ))}
                      </div>
                      <div className="decision-heading">
                        <p className="eyebrow">
                          {PHASES[game.phase].toUpperCase()} · CHOOSE ONE ACTION
                        </p>
                        <h2>
                          {stageOf(a).dependent
                            ? "A small life, a vulnerable beginning."
                            : "How will you spend this phase?"}
                        </h2>
                        <p className="muted small">
                          {stageOf(a).dependent
                            ? "You depend on protection and stored or provisioned nourishment. Independent behavior comes with development."
                            : `Naturally ${sp.active === "night" ? "nocturnal" : sp.active === "day" ? "diurnal" : "most active around dawn and dusk"}. Lower hunger, stress and injury are better.`}
                        </p>
                      </div>
                      <div className="action-grid">
                        {availableActions(game).map((action) => (
                          <button
                            key={action}
                            className="action-card"
                            disabled={busy}
                            onClick={() =>
                              attempt(() => update(act(game, action)))
                            }
                          >
                            <span className="action-icon">
                              {action === "explore" ? (
                                <Icon name="arrow" size={20} />
                              ) : (
                                ACTIONS[action].icon
                              )}
                            </span>
                            <span>
                              <b>{actionTitle(game, action)}</b>
                              <small>
                                {action === "feed" && stageOf(a).dependent
                                  ? "Depend on your nursery. Restore condition if resources are available."
                                  : ACTIONS[action].detail}
                              </small>
                            </span>
                            <span className="action-chevron">
                              <Icon name="arrow" size={14} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="panel time-panel">
                      <div className="section-heading compact">
                        <div>
                          <h3>Let life unfold</h3>
                          <p className="muted small">
                            Routine behavior continues. Survival is never
                            guaranteed.
                          </p>
                        </div>
                        <Icon name="leaf" />
                      </div>
                      <label className="priority">
                        Autonomous priority
                        <select
                          value={game.priority}
                          onChange={(e) =>
                            setGame({
                              ...game,
                              priority: e.target.value as Priority,
                            })
                          }
                        >
                          {[
                            "survival",
                            "feeding",
                            "reproduction",
                            "exploration",
                          ].map((p) => (
                            <option key={p} value={p}>
                              {p[0].toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="skip-controls">
                        {skipOptions(game).map((days) => (
                          <button
                            className="button subtle"
                            key={days}
                            disabled={busy}
                            onClick={() => doSkip(days)}
                          >
                            {days === 1
                              ? "Next day"
                              : days === 365
                                ? "Skip 1 year"
                                : `Skip ${days} days`}{" "}
                            <span>»</span>
                          </button>
                        ))}
                      </div>
                      <p className="small muted">
                        {busy
                          ? "Resolving each phase…"
                          : "Skips can stop early for serious danger. Rare opportunities may pass unnoticed."}
                      </p>
                    </section>
                    <section className="recent-journal">
                      <div className="section-heading compact">
                        <h3>From your journal</h3>
                        <button
                          className="text-button"
                          onClick={() => navigate("journal")}
                        >
                          Read all <Icon name="arrow" size={16} />
                        </button>
                      </div>
                      {lifeJournal
                        .slice(-3)
                        .reverse()
                        .map((e) => (
                          <div className={`journal-line ${e.kind}`} key={e.id}>
                            <span className="journal-dot" />
                            <div>
                              <small>
                                {formatDate(e.date)} · {e.phase}
                              </small>
                              <p>{e.text}</p>
                            </div>
                          </div>
                        ))}
                    </section>
                  </div>
                </div>
              </>
            ))}
          {screen === "journal" && (
            <>
              <SectionTitle
                eyebrow="THE DAYS THAT MADE A LIFE"
                title="Your life, in the margins."
                detail="Choices, close calls and quiet moments. A field record of your current individual."
              />
              {!a ? (
                <Empty
                  title="An unwritten chapter."
                  detail="Your journal begins with your first birth."
                  button="Begin a life"
                  onClick={() => navigate("birth")}
                />
              ) : (
                <>
                  <div className="journal-header panel">
                    <div>
                      <Tag tone="green">
                        {a.alive ? "LIVING RECORD" : "COMPLETE"}
                      </Tag>
                      <h2>
                        {a.name} · {sp.name}
                      </h2>
                      <p className="muted">
                        Born {formatDate(a.birth)} · {lifeJournal.length}{" "}
                        observations
                      </p>
                    </div>
                    <label className="input-label">
                      Show
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All observations</option>
                        <option value="notable">Milestones & dangers</option>
                      </select>
                    </label>
                  </div>
                  <div className="journal-timeline">
                    {[...lifeJournal]
                      .reverse()
                      .filter(
                        (e) => filter !== "notable" || e.kind !== "routine",
                      )
                      .map((e) => (
                        <article
                          className={`journal-entry ${e.kind}`}
                          key={e.id}
                        >
                          <div className="journal-date">
                            <b>{formatDate(e.date)}</b>
                            <span>
                              {e.phase} · Day {e.age}
                            </span>
                          </div>
                          <div>
                            <Tag
                              tone={
                                e.kind === "danger" || e.kind === "death"
                                  ? "amber"
                                  : ""
                              }
                            >
                              {e.kind}
                            </Tag>
                            <p>{e.text}</p>
                          </div>
                        </article>
                      ))}
                  </div>
                  <p className="muted small">
                    The latest 2,000 observations across all lives are retained.
                    Lifetime and family records are permanent.
                  </p>
                </>
              )}
            </>
          )}
          {screen === "collection" && (
            <>
              <SectionTitle
                eyebrow="A LIVING ENCYCLOPEDIA"
                title="So many ways to exist."
                detail={`${game.unlocked.length} of ${SPECIES.length} species discovered. Every unlocked species can become your next life.`}
              >
                <button
                  className="button subtle"
                  onClick={() => navigate("packs")}
                >
                  Discover field packs <Icon name="arrow" size={16} />
                </button>
              </SectionTitle>
              <div className="collection-toolbar">
                <Tag tone="green">10 FOUNDING SPECIES · ALWAYS UNLOCKED</Tag>
                <span className="muted small">
                  Rarity is a collection attribute, not conservation status.
                </span>
              </div>
              <div className="species-grid">
                {SPECIES.map((species) => {
                  const unlocked = game.unlocked.includes(species.id);
                  return (
                    <button
                      key={species.id}
                      className={`species-card ${unlocked ? "" : "locked"}`}
                      onClick={() => setInspect(species)}
                    >
                      <div className="species-card-image">
                        <Photo species={species} />
                        <Tag tone={unlocked ? "green" : ""}>
                          {unlocked ? "UNLOCKED" : "LOCKED · FIELD PACK"}
                        </Tag>
                        <span
                          className={`rarity ${species.rarity.toLowerCase()}`}
                        >
                          {species.rarity}
                        </span>
                      </div>
                      <div className="species-card-body">
                        <small>{species.group}</small>
                        <h3>{species.name}</h3>
                        <i>{species.scientific}</i>
                        <div>
                          <span>{species.locations[0].continent}</span>
                          <span>
                            View field guide <Icon name="arrow" size={14} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {screen === "packs" && (
            <>
              <SectionTitle
                eyebrow="NEW LIVES TO DISCOVER"
                title="The world is full of possibility."
                detail="Spend the Coins earned from meaningful lives. No real money. No purchases beyond this notebook."
              />
              <div className="shop-layout">
                <section className="pack-showcase panel">
                  <div className="physical-pack">
                    <span className="pack-number">VOLUME 01</span>
                    <Icon name="leaf" size={80} />
                    <h2>
                      The
                      <br />
                      Living
                      <br />
                      World
                    </h2>
                    <span className="pack-seal">ONE SPECIES CARD</span>
                    <div className="pack-line" />
                  </div>
                  <Tag tone="gold">FIELD PACK · 01</Tag>
                  <h2>Wild beginnings</h2>
                  <p className="muted">
                    One card. A new perspective.
                    <br />
                    Every discovery joins your random birth pool.
                  </p>
                  <button
                    className="button primary"
                    disabled={game.coins < PACK.cost}
                    onClick={() =>
                      attempt(() => {
                        setGame(openPack(game));
                        setNotice("Your field pack has opened.");
                      })
                    }
                  >
                    Open pack <Icon name="coin" size={18} />
                    {PACK.cost}
                  </button>
                  <p className="small muted">
                    {game.coins < PACK.cost
                      ? `Earn ${PACK.cost - game.coins} more Coins through completed lives.`
                      : "You have enough earned Coins."}
                  </p>
                </section>
                <div className="shop-details">
                  <section className="panel">
                    <p className="eyebrow">TRANSPARENT BY NATURE</p>
                    <h2>Inside this pack</h2>
                    <p className="muted small">
                      One independent draw from the configured pool. No hidden
                      guarantees or paid currency.
                    </p>
                    {PACK.drops.map((drop) => {
                      const species = speciesById(drop.id);
                      return (
                        <div className="drop-row" key={drop.id}>
                          <Photo species={species} />
                          <div>
                            <b>{species.name}</b>
                            <small>{species.rarity}</small>
                          </div>
                          <strong>{drop.weight}%</strong>
                        </div>
                      );
                    })}
                    <p className="small muted">
                      Epic and Legendary tiers are reserved for future content
                      and have 0% probability in this pack. Duplicate cards
                      return {PACK.duplicateRefund} Coins immediately; a
                      duplicate costs {PACK.cost - PACK.duplicateRefund} net
                      Coins.
                    </p>
                  </section>
                  {game.lastPack && (
                    <section className="panel pack-result" aria-live="polite">
                      <p className="eyebrow">YOUR LATEST DISCOVERY</p>
                      <Photo species={speciesById(game.lastPack.speciesId)} />
                      <Tag tone="gold">
                        {game.lastPack.duplicate
                          ? "DUPLICATE · +20 COINS RETURNED"
                          : "NEW SPECIES UNLOCKED"}
                      </Tag>
                      <h2>{speciesById(game.lastPack.speciesId).name}</h2>
                      <p className="muted small">
                        {game.lastPack.duplicate
                          ? "Already in your collection. Your conversion has been applied."
                          : "Now available in random births and manual selection."}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("collection")}
                      >
                        Visit your collection <Icon name="arrow" size={16} />
                      </button>
                    </section>
                  )}
                </div>
              </div>
            </>
          )}
          {screen === "family" && (
            <>
              <SectionTitle
                eyebrow="LIFE LEAVES ROOTS"
                title="A story bigger than one life."
                detail="Parents, offspring and the threads between them. Inheritance is modest variation, never instant evolution."
              />
              {!Object.keys(game.family).length ? (
                <Empty
                  title="Your family tree takes root at birth."
                  detail="Survive, mature and find a breeding opportunity to create a bloodline."
                  button="Begin a new life"
                  onClick={() => navigate("birth")}
                />
              ) : (
                <>
                  <div className="field-note">
                    <Icon name="tree" />
                    <p>
                      Offspring age with their family’s world. After a parent’s
                      death, a surviving direct offspring can become your next
                      playable individual.
                    </p>
                  </div>
                  <div className="family-tree">
                    {Object.values(game.family).map((relative) => (
                      <Relative
                        key={relative.id}
                        animal={relative}
                        game={game}
                        onContinue={() =>
                          attempt(() => {
                            setGame(continueBloodline(game, relative.id));
                            navigate("life");
                          })
                        }
                      />
                    ))}
                  </div>
                  <p className="muted small">
                    Worker insects contribute to colony success without
                    reproduction. Only sampled cohorts are tracked for
                    high-fecundity species.
                  </p>
                </>
              )}
            </>
          )}
          {screen === "summary" && (
            <>
              <SectionTitle
                eyebrow="A LIFE, REMEMBERED"
                title={
                  record
                    ? `${record.name} left a trace.`
                    : "Every ending is a record."
                }
                detail="The individual is gone. The story, collection and surviving bloodline remain."
              />
              {!record ? (
                <Empty
                  title="No completed lives yet."
                  detail="Take your time. There is a whole world to experience."
                  button={a?.alive ? "Return to life" : "Begin a life"}
                  onClick={() => navigate(a?.alive ? "life" : "birth")}
                />
              ) : (
                <>
                  <div className="summary-layout">
                    <div className="summary-image">
                      <Photo species={speciesById(record.speciesId)} />
                      <div>
                        <Tag tone="gold">LIFETIME RECORD</Tag>
                        <h2>{record.name}</h2>
                        <i>{speciesById(record.speciesId).scientific}</i>
                      </div>
                    </div>
                    <section className="panel">
                      <p className="eyebrow">
                        {speciesById(record.speciesId).name}
                      </p>
                      <h2>{ageLabel(record.age)} in the living world.</h2>
                      <dl className="record-details">
                        <div>
                          <dt>Born</dt>
                          <dd>{formatDate(record.birth)}</dd>
                        </div>
                        <div>
                          <dt>Died</dt>
                          <dd>{formatDate(record.death)}</dd>
                        </div>
                        <div>
                          <dt>Cause of death</dt>
                          <dd>{record.cause}</dd>
                        </div>
                        <div>
                          <dt>Offspring</dt>
                          <dd>
                            {record.offspring} born · {record.surviving} alive
                            at death
                          </dd>
                        </div>
                      </dl>
                      <div className="reward">
                        <div>
                          <small>SPECIES SUCCESS</small>
                          <b>
                            {record.score}
                            <span>points</span>
                          </b>
                        </div>
                        <div>
                          <small>COINS EARNED</small>
                          <b>
                            +{record.coins}
                            <Icon name="coin" size={24} />
                          </b>
                        </div>
                      </div>
                      <div className="achievement-list">
                        {record.achievements.map((t) => (
                          <Tag tone="gold" key={t}>
                            {t}
                          </Tag>
                        ))}
                        {!record.achievements.length && (
                          <p className="muted small">
                            Not every life reaches a milestone. Survival is
                            never guaranteed.
                          </p>
                        )}
                      </div>
                      <button
                        className="button primary full"
                        onClick={() => navigate(a?.alive ? "life" : "birth")}
                      >
                        {a?.alive
                          ? "Return to your current life"
                          : "Start a new life"}
                        <Icon name="arrow" />
                      </button>
                      <button
                        className="button subtle full"
                        onClick={() => navigate("family")}
                      >
                        View bloodline & eligible offspring
                      </button>
                    </section>
                  </div>
                  <section className="panel record-events">
                    <h3>Moments that mattered</h3>
                    {game.journal
                      .filter(
                        (e) =>
                          e.individualId === record.individualId &&
                          e.kind !== "routine",
                      )
                      .map((e) => (
                        <div className="journal-line" key={e.id}>
                          <span className="journal-dot" />
                          <div>
                            <small>{formatDate(e.date)}</small>
                            <p>{e.text}</p>
                          </div>
                        </div>
                      ))}
                  </section>
                  <label className="input-label">
                    Other lifetime records
                    <select
                      value={record.individualId}
                      onChange={(e) => setSelectedRecord(e.target.value)}
                    >
                      {game.records.map((r) => (
                        <option key={r.individualId} value={r.individualId}>
                          {r.name} · {speciesById(r.speciesId).name} ·{" "}
                          {ageLabel(r.age)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </>
          )}
          {screen === "settings" && (
            <>
              <SectionTitle
                eyebrow="LOOK AFTER YOUR NOTEBOOK"
                title="Settings & save management."
                detail="No account. No server. Your progress lives in this browser, on this device."
              />
              <div className="settings-grid">
                <section className="panel">
                  <h2>Your save</h2>
                  <p className="muted">
                    {saveStatus}. Save format version {game.version}. Export a
                    backup before clearing browser data or switching devices.
                  </p>
                  <button className="button primary" onClick={exportSave}>
                    Export save as JSON <span>↓</span>
                  </button>
                  <hr />
                  <label className="input-label">
                    Import a backup
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5000000)
                            setNotice("Save exceeds 5 MB");
                          else
                            file
                              .text()
                              .then(setImportText)
                              .catch(() => setNotice("Could not read file"));
                        }
                      }}
                    />
                  </label>
                  <label className="input-label">
                    Or paste save JSON
                    <textarea
                      rows={5}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste your version 1 save here…"
                    />
                  </label>
                  <button
                    className="button subtle"
                    disabled={!importText.trim()}
                    onClick={() =>
                      attempt(() => {
                        deserialize(importText);
                        setConfirm("import");
                      })
                    }
                  >
                    Validate & import
                  </button>
                </section>
                <section className="panel">
                  <p className="eyebrow">MODEL NOTES</p>
                  <h2>A foundation, not a field study.</h2>
                  <p className="muted">
                    Species profiles use biological reference ranges. Survival
                    probabilities, phase costs, historical pressures and reward
                    values are simplified game parameters.
                  </p>
                  <p className="muted">
                    Phase 1 supports modern scenarios only. Gregorian dates use
                    astronomical years internally; prehistoric ecology is not
                    implemented.
                  </p>
                  <p className="muted">
                    No real-money purchases, external AI, analytics,
                    authentication or paid services.
                  </p>
                  <hr />
                  <h3>Close a chapter</h3>
                  <p className="muted small">
                    Abandoning ends the current individual permanently and
                    awards no Coins. Family and collection progress remain.
                  </p>
                  <button
                    className="button danger"
                    disabled={!a?.alive}
                    onClick={() => setConfirm("abandon")}
                  >
                    Abandon current life
                  </button>
                  <hr />
                  <h3>Reset all progress</h3>
                  <p className="muted small">
                    Deletes the active life, family records, collection unlocks,
                    Coins and browser backup.
                  </p>
                  <button
                    className="button danger"
                    onClick={() => setConfirm("reset")}
                  >
                    Reset this device’s save
                  </button>
                </section>
              </div>
              <section className="panel credits">
                <p className="eyebrow">NATURAL HISTORY & PHOTOGRAPHY</p>
                <h2>Sources & credits</h2>
                <p className="muted small">
                  Biological reading:{" "}
                  <a
                    href="https://animaldiversity.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Animal Diversity Web
                  </a>
                  ,{" "}
                  <a
                    href="https://www.iucnredlist.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    IUCN Red List
                  </a>
                  , and species-specific references in the field guides. Photos
                  are cached locally; no image service is contacted while
                  playing. See repository documentation for assumptions.
                </p>
                {credits
                  .filter((c) => !("error" in c))
                  .map((c) => (
                    <p className="small muted" key={c.id}>
                      <a href={c.source} target="_blank" rel="noreferrer">
                        {speciesById(c.id).name} · {c.file}
                      </a>{" "}
                      · {c.license} ·{" "}
                      {(c.artist ?? "See source").replace(/<[^>]*>/g, "")} ·
                      Cropped for display.
                    </p>
                  ))}
              </section>
            </>
          )}
          <footer className="footer">
            <span>
              <Icon name="leaf" size={14} />
              {BRAND.title} <b> / </b> {BRAND.edition}
            </span>
            <span>A different life. The same living world.</span>
          </footer>
        </main>
      </div>
      {inspect && (
        <div className="modal-backdrop" onClick={() => setInspect(null)}>
          <section
            className="field-guide modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="field-guide-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setInspect(null);
            }}
          >
            <button
              className="modal-close"
              aria-label="Close field guide"
              onClick={() => setInspect(null)}
            >
              ×
            </button>
            <Photo species={inspect} />
            <div className="guide-content">
              <p className="eyebrow">
                SPECIES FIELD GUIDE · {inspect.rarity.toUpperCase()}
              </p>
              <h2 id="field-guide-title">{inspect.name}</h2>
              <i>{inspect.scientific}</i>
              <dl>
                {[
                  ["Range", inspect.range],
                  [
                    "Habitat",
                    inspect.locations.map((l) => l.habitat).join(", "),
                  ],
                  [
                    "Wild lifespan",
                    `${ageLabel(inspect.lifespan)} typical reference · ${ageLabel(inspect.maxLifespan)} modeled upper bound`,
                  ],
                  [
                    "Development",
                    inspect.stages
                      .map((s) => `${s.name}: day ${s.fromDay}+`)
                      .join(" → "),
                  ],
                  ["Diet & feeding", `${inspect.diet}. ${inspect.feeding}`],
                  ["Social life", inspect.social],
                  ["Reproduction", inspect.reproduction],
                  [
                    "Threats",
                    `${inspect.predators.join(", ")}. ${inspect.mortality.join(", ")}.`,
                  ],
                  ["Survival challenge", inspect.challenge],
                  ["Model scope", inspect.note],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <a
                className="text-button"
                href={`https://animaldiversity.org/accounts/${inspect.scientific.replaceAll(" ", "_")}/`}
                target="_blank"
                rel="noreferrer"
              >
                Biological reference · Animal Diversity Web{" "}
                <Icon name="arrow" size={14} />
              </a>
              <p className="small muted">
                Playable dates: 1900, 1980, 2020. Rarity does not describe
                conservation status.
              </p>
              <button
                className="button primary full"
                disabled={!game.unlocked.includes(inspect.id) || !!a?.alive}
                onClick={() => {
                  setMode("manual");
                  setSelectedSpecies(inspect.id);
                  setRevealed(false);
                  navigate("birth");
                }}
              >
                {!game.unlocked.includes(inspect.id)
                  ? "Discover this species in field packs"
                  : a?.alive
                    ? "Finish your current life to start another"
                    : "Begin a life as this species"}
              </button>
            </div>
          </section>
        </div>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <p className="eyebrow">SAVE MANAGEMENT</p>
            <h2 id="confirm-title">
              {confirm === "reset"
                ? "Start with an empty notebook?"
                : confirm === "abandon"
                  ? "End this life permanently?"
                  : "Replace your current save?"}
            </h2>
            <p className="muted">
              {confirm === "reset"
                ? "This removes all progress and the browser backup. Export first if you want to keep a copy."
                : confirm === "abandon"
                  ? "The individual cannot be resumed. No Coins will be earned for abandonment."
                  : "The validated backup will replace your active save. Export the current one first if you want to keep it."}
            </p>
            <div className="button-row">
              <button
                className="button subtle"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                className={`button ${confirm === "import" ? "primary" : "danger"}`}
                onClick={commitConfirmation}
              >
                {confirm === "reset"
                  ? "Delete all local progress"
                  : confirm === "abandon"
                    ? "End this life"
                    : "Import backup"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Empty({
  title,
  detail,
  button,
  onClick,
}: {
  title: string;
  detail: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <section className="panel empty">
      <Icon name="leaf" size={48} />
      <h2>{title}</h2>
      <p className="muted">{detail}</p>
      <button className="button primary" onClick={onClick}>
        {button}
        <Icon name="arrow" />
      </button>
    </section>
  );
}
function Relative({
  animal,
  game,
  onContinue,
}: {
  animal: Individual;
  game: GameState;
  onContinue: () => void;
}) {
  const active = current(game);
  const eligible =
    !active?.alive && !!active?.children.includes(animal.id) && animal.alive;
  return (
    <article
      className={`relative panel ${animal.id === active?.id ? "controlled" : ""}`}
      style={{ marginLeft: `${Math.min(animal.generation - 1, 3) * 20}px` }}
    >
      <Photo species={speciesById(animal.speciesId)} />
      <div>
        <p className="eyebrow">
          GENERATION {animal.generation} ·{" "}
          {animal.alive ? "LIVING" : "DECEASED"}
          {animal.id === active?.id ? " · YOUR INDIVIDUAL" : ""}
        </p>
        <h3>
          {animal.name} <i>{speciesById(animal.speciesId).name}</i>
        </h3>
        <p className="small muted">
          {animal.sex} · {ageLabel(animal.ageDays)} · {stageOf(animal).name} ·
          Born {formatDate(animal.birth)}
          {animal.death ? ` · Died ${formatDate(animal.death)}` : ""}
        </p>
        <p className="small muted">
          {animal.parentId
            ? `Child of ${game.family[animal.parentId]?.name}`
            : "Bloodline founder"}{" "}
          · Resilience {Math.round(animal.traits.resilience)} · Perception{" "}
          {Math.round(animal.traits.perception)}
        </p>
      </div>
      {eligible && (
        <button className="button primary" onClick={onContinue}>
          Continue as {animal.name} <Icon name="arrow" size={16} />
        </button>
      )}
    </article>
  );
}
export default App;
