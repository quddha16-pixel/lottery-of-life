import { useId } from "react";
import { current, PHASES, stageOf } from "../game/engine";
import { nearby, sceneState } from "../game/wildlife";
import { speciesById } from "../data/species";
import type { GameState } from "../game/types";
import { Photo } from "./UI";

// Original, small vector illustrations. No external artwork or runtime image service.
function AnimalArt({
  species,
  brood = false,
}: {
  species: string;
  brood?: boolean;
}) {
  if (brood)
    return (
      <g fill="#d2bea0" stroke="#6e5141" strokeWidth="2">
        <ellipse cx="96" cy="99" rx="28" ry="42" transform="rotate(68 96 99)" />
        <path
          d="M72 83q15 9 13 33m1-39q18 12 14 41m1-39q16 10 13 34"
          fill="none"
        />
      </g>
    );
  if (species === "elephant")
    return (
      <g stroke="#4d5452" strokeWidth="2" strokeLinejoin="round">
        <path
          d="M39 91Q34 57 72 49q48-10 75 22l-3 53-20 6-8-19-41 1-8 24-20-2-2-38"
          fill="#939b92"
        />
        <path
          d="m49 105-3 44q9 7 18 0l9-39m40 0 5 38q12 8 22-1l-1-46"
          fill="#7a8780"
        />
        <path
          d="M127 65q31-13 42 14l-1 30q2 23 21 16-4 21-21 16-15-4-18-37l-13-10"
          fill="#a4aaa0"
        />
        <path d="M126 64q-24-9-27 13-2 28 24 28 14-4 14-22Z" fill="#7b8983" />
        <path d="M109 70q-14 4-9 21m-57-7q-18 1-15 35" fill="none" />
        <circle cx="156" cy="81" r="2.8" fill="#232b25" />
        <path d="m160 98 8 9-11-3" fill="#eee3bf" />
      </g>
    );
  if (species === "wolf")
    return (
      <g stroke="#333e3b" strokeWidth="2" strokeLinejoin="round">
        <path d="M46 91Q19 75 10 87q-4 16 31 26" fill="#7d8175" />
        <path
          d="m39 94 16-29 50-5 27-21 11 22 17 4 9 16-24 13-11 14-55 5-33-1Z"
          fill="#9c9b88"
        />
        <path d="m52 106-7 40 12 2 14-39m40-2 8 39 12 1-3-45" fill="#7e857a" />
        <path
          d="m102 67 26-42 6 23 14-20-1 32 14 7-15 25-29-5"
          fill="#aca990"
        />
        <path d="m143 77 19-5 10 8-26 12-14-2" fill="#dad1ae" />
        <path d="m128 39 3 12-10 4m18-11 4-6-1 14" fill="#625f53" />
        <circle cx="145" cy="66" r="2.4" fill="#1c2523" />
        <path d="m167 77 7 2-4 5-5-3" fill="#252d28" />
        <path d="m82 73-16 22m40-25-12 25" stroke="#bdb99e" fill="none" />
      </g>
    );
  if (species === "ant")
    return (
      <g stroke="#322820" strokeWidth="4" fill="#75513a" strokeLinecap="round">
        <path
          d="m90 101-24-25-25-5m46 34-27 9-18 24m53-29-10 29-15 14m38-49 18-31 20-4m-32 39 29 4 19 27m-49-25 5 28 18 14"
          fill="none"
        />
        <ellipse cx="55" cy="94" rx="28" ry="20" />
        <ellipse cx="100" cy="99" rx="18" ry="14" />
        <ellipse cx="135" cy="90" rx="19" ry="17" />
        <path d="m145 77 7-25 19-11m-33 32-3-23 13-17" fill="none" />
        <circle cx="144" cy="86" r="2" fill="#151e17" />
        <path d="m149 96 12-3m-11 6 9 5" fill="none" />
      </g>
    );
  return null;
}
export function WildlifeScene({ game }: { game: GameState }) {
  const a = current(game)!,
    sp = speciesById(a.speciesId),
    scene = sceneState(game),
    uid = useId().replaceAll(":", "");
  const supported = ["elephant", "wolf", "ant"].includes(a.speciesId),
    brood = ["Egg", "Larva", "Pupa"].includes(stageOf(a).name),
    night = scene.phase === "night";
  const friends = nearby(game)
    .filter((n) => n.species === sp.name && n.role !== "rival")
    .slice(0, 2);
  return (
    <figure
      className={`wildlife-scene ${scene.palette} ${scene.phase} ${scene.rain ? "raining" : ""}`}
      aria-label={`${PHASES[game.phase]} at ${scene.node.label}. ${scene.season}. ${game.environment!.weather}. ${game.environment!.location.region}. ${stageOf(a).name} ${sp.name}.`}
    >
      <svg
        className="habitat-art"
        viewBox="0 0 800 460"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Illustrated ${scene.palette} habitat with your ${sp.name.toLowerCase()}`}
      >
        <defs>
          <linearGradient id={`${uid}sky`} x2="0" y2="1">
            <stop
              stopColor={
                night
                  ? "#172935"
                  : scene.phase === "evening"
                    ? "#9a785b"
                    : scene.palette === "marine"
                      ? "#2b6870"
                      : "#7c9b89"
              }
            />
            <stop
              offset="1"
              stopColor={
                night
                  ? "#536457"
                  : scene.phase === "afternoon"
                    ? "#d7ba7d"
                    : "#c6c39a"
              }
            />
          </linearGradient>
          <linearGradient id={`${uid}ground`} x2="0" y2="1">
            <stop
              stopColor={scene.palette === "savanna" ? "#7a8051" : "#365449"}
            />
            <stop offset="1" stopColor="#182e27" />
          </linearGradient>
          <radialGradient id={`${uid}glow`}>
            <stop stopColor="#f4dcb0" stopOpacity=".6" />
            <stop offset="1" stopColor="#edcf9e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="460" fill={`url(#${uid}sky)`} />
        <circle
          cx={
            scene.phase === "morning"
              ? 190
              : scene.phase === "afternoon"
                ? 560
                : 665
          }
          cy={night ? 90 : scene.phase === "evening" ? 170 : 88}
          r="100"
          fill={`url(#${uid}glow)`}
        />
        <circle
          cx={
            scene.phase === "morning"
              ? 190
              : scene.phase === "afternoon"
                ? 560
                : 665
          }
          cy={night ? 90 : scene.phase === "evening" ? 170 : 88}
          r={night ? 18 : 28}
          fill={night ? "#dedfc4" : "#e8d4a0"}
          opacity=".8"
        />
        {night &&
          [70, 145, 270, 330, 450, 600, 740].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={30 + ((i * 31) % 120)}
              r="1.5"
              fill="#d0d9cb"
            />
          ))}
        <path
          d="M0 240Q130 120 260 210T520 180T800 225V460H0Z"
          fill="#627e69"
          opacity=".55"
        />
        <path
          d="M0 280Q190 210 370 260T800 238V460H0Z"
          fill={`url(#${uid}ground)`}
        />
        {scene.palette === "savanna" ? (
          <g>
            <path
              d="m115 306 12-148 8 1 9 146m-13-95-39-42m40 24 42-41"
              stroke="#3c5140"
              strokeWidth="10"
              fill="none"
            />
            <path
              d="M34 159q-4-32 49-33 28-26 56-8 47-14 73 23 24 36-44 31l-84 5q-40 3-50-18"
              fill="#405d43"
            />
            <path
              d="m655 273 8-87m2 30-21-21"
              stroke="#4e6346"
              strokeWidth="6"
            />
            <path
              d="M612 184q12-32 45-22 33-14 58 15 11 19-28 19h-48Z"
              fill="#59734b"
            />
          </g>
        ) : scene.palette === "colony" ? (
          <g>
            <path
              d="M0 0H800V215Q680 180 601 243T340 199T0 225Z"
              fill="#393a29"
            />
            <path
              d="M0 30q130 50 112 172m110-202q-35 134 30 207M650 0q-80 153-20 210"
              stroke="#66553a"
              strokeWidth="18"
              fill="none"
            />
            <ellipse cx="400" cy="315" rx="228" ry="67" fill="#6e5d3e" />
            <path
              d="m300 304q-20-44 20-40 35-30 49 11 53-18 46 27Z"
              fill="#a6ac78"
            />
            <path d="m505 287q-20-45 16-43 37-19 51 25Z" fill="#a6ac78" />
          </g>
        ) : scene.palette === "marine" ? (
          <g fill="none" stroke="#387f65" strokeWidth="12">
            <path d="M84 460q-40-80 6-160t-6-116m62 276q-40-100 6-220m520 220q-20-80 13-150t-6-80" />
          </g>
        ) : scene.palette === "grassland" ? (
          <g fill="#60734d">
            <path d="M0 316q90-47 167-9t132 16q55-25 98 7H0Z" />
            <path d="M540 326q45-64 77-8 70-35 183 7v25H540Z" />
            <path
              d="M30 380l13-60 5 62 18-44-5 46m627-10 13-63 4 64 19-40-5 42"
              stroke="#859267"
              strokeWidth="3"
              fill="none"
            />
          </g>
        ) : (
          <g>
            {[55, 155, 636, 735].map((x, i) => (
              <g key={x}>
                <path d={`M${x} 330l8-220 10 0 4 220`} fill="#344d40" />
                <path
                  d={`M${x - 48} ${140 + (i % 2) * 20}q-30-50 35-75 35-65 72-7 75 0 45 76-70 29-152 6`}
                  fill={i % 2 ? "#3f614a" : "#496c50"}
                />
              </g>
            ))}
          </g>
        )}
        {(scene.node.kind === "water" || scene.palette === "marine") && (
          <path
            d={worldWaterPath(game.world!.water)}
            fill="#6c9e9b"
            opacity=".65"
          />
        )}
        <path
          d="M0 369q165-36 320 4t480-24v111H0Z"
          fill="#243f31"
          opacity=".6"
        />
        {supported &&
          friends.map((n, i) => (
            <g
              key={n.id}
              transform={`translate(${450 + i * 145} ${a.speciesId === "ant" ? 220 : 200}) scale(${a.speciesId === "ant" ? 0.48 : 0.72})`}
              opacity={i ? 0.45 : 0.65}
            >
              <AnimalArt species={a.speciesId} />
            </g>
          ))}
        {supported && (
          <g
            className="scene-player"
            transform={`translate(${a.speciesId === "ant" ? 275 : scene.dependent ? 235 : 180} ${a.speciesId === "ant" ? 130 : scene.dependent ? 120 : 100}) scale(${a.speciesId === "ant" ? 1.3 : scene.dependent ? 1.2 : 1.45})`}
          >
            <ellipse
              cx="102"
              cy="154"
              rx="84"
              ry="8"
              fill="#142820"
              opacity=".35"
            />
            <AnimalArt species={a.speciesId} brood={brood} />
          </g>
        )}
        <g fill="#aeb477" opacity=".65">
          {[30, 105, 210, 540, 700, 770].map((x, i) => (
            <path key={x} d={`m${x} 440 3-${25 + i * 3} 7 25 10-19-4 23Z`} />
          ))}
        </g>
        <rect
          width="800"
          height="460"
          fill={night ? "#102335" : "#8d9b68"}
          opacity={night ? 0.35 : scene.season === "Cool season" ? 0.14 : 0}
        />
        {scene.rain && (
          <g
            stroke="#d1e1d1"
            strokeWidth="1.5"
            opacity=".4"
            className="scene-rain"
          >
            {Array.from({ length: 28 }, (_, i) => (
              <path key={i} d={`m${(i * 103) % 820} ${(i * 59) % 420} -9 22`} />
            ))}
          </g>
        )}
      </svg>
      {!supported && (
        <div className="scene-specimen">
          <Photo species={sp} />
        </div>
      )}
      <figcaption>
        <span>{scene.node.label}</span>
        <small>
          {game.environment!.location.region} ·{" "}
          {game.environment!.location.habitat}
        </small>
      </figcaption>
      <div className="scene-weather">
        {PHASES[game.phase]} · {Math.round(scene.temperature)}°C ·{" "}
        {game.environment!.weather}
      </div>
      {game.world!.water < 0.3 && (
        <span className="scene-condition">Water is receding</span>
      )}
    </figure>
  );
}
function worldWaterPath(water: number) {
  return water < 0.3
    ? "M800 335q-120 25-165 125h165Z"
    : "M800 265q-250 25-350 195h350Z";
}
