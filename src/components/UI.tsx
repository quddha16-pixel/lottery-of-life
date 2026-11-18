import type { ReactNode } from "react";
import type { Species } from "../game/types";
import credits from "../data/image-credits.json";
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
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
export function Photo({
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
export function Tag({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function SectionTitle({
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
export function Meter({
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
