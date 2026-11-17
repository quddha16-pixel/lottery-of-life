import type { GameState } from "../game/types";
import { locationNow } from "../game/wildlife";
// Original habitat details respond to location and saved resources, not a random picture deck.
export function HabitatDetails({ game }: { game: GameState }) {
  const a = game.family[game.currentId!],
    r = a.biology!.stores,
    n = locationNow(game),
    patch = game.world!.patches.find((p) => p.id === n.id)!;
  const nursery = ["Egg", "Larva", "Pupa"].includes(a.biology!.stage);
  if (a.speciesId === "ant")
    return n.id === "home" || n.id === "shade" ? (
      <g>
        <path d="M0 295q130-75 270-25l-9 190H0Z" fill="#6d6446" />
        {nursery && n.id === "home" ? (
          <g fill="#d6c59d" stroke="#8e7955" strokeWidth="3">
            {[35, 75, 130, 175, 218].map((x, i) => (
              <ellipse
                key={x}
                cx={x}
                cy={305 + (i % 2) * 30}
                rx="17"
                ry="28"
                transform={`rotate(35 ${x} 315)`}
              />
            ))}
          </g>
        ) : (
          <g
            fill={r.fungus > 35 ? "#b2bd8a" : "#7b7150"}
            stroke="#879769"
            strokeWidth="2"
          >
            {Array.from(
              { length: Math.max(3, Math.floor(r.fungus / 8)) },
              (_, i) => (
                <g key={i}>
                  <ellipse
                    cx={45 + ((i * 43) % 200)}
                    cy={300 + ((i * 17) % 55)}
                    rx="25"
                    ry="15"
                  />
                  <path
                    d={`m${50 + ((i * 43) % 200)} ${300 + ((i * 17) % 55)}q-18-15-30 0m30 0q-5 23-20 19`}
                    fill="none"
                  />
                </g>
              ),
            )}
          </g>
        )}
        {r.contamination > 35 && (
          <g fill="#554932">
            {[40, 80, 130, 180].map((x, i) => (
              <ellipse key={x} cx={x} cy={375 + (i % 2) * 12} rx="11" ry="7" />
            ))}
          </g>
        )}
      </g>
    ) : (
      <g fill="#7c9b58" stroke="#a0b473" strokeWidth="3">
        <path d="M18 295q-30-115 91-130 40 105-91 130M102 365q-30-120 112-130 16 122-112 130M633 301q13-154 148-147-1 122-148 147" />
        <path d="m25 285 61-95m32 156 68-85m461 24 102-103" fill="none" />
      </g>
    );
  if (a.speciesId === "bumblebee")
    return n.id === "home" || n.id === "shade" ? (
      <g>
        <path d="M0 270q115-50 245 10l45 180H0Z" fill="#89724b" />
        {[35, 88, 151, 211].map((x, i) => (
          <g key={x}>
            <ellipse
              cx={x}
              cy={304 + (i % 2) * 28}
              rx="32"
              ry="27"
              fill="#b49357"
              stroke="#d1b77e"
              strokeWidth="4"
            />
            <ellipse
              cx={x}
              cy={300 + (i % 2) * 28}
              rx="22"
              ry="15"
              fill={r.broodFood > 30 ? "#cbbb7e" : "#695d3e"}
            />
          </g>
        ))}
        <path
          d="m15 410 37-49-11 57 35-40-17 44m145-3 12-62 11 60 31-41-16 50"
          stroke="#8a9b5f"
          strokeWidth="8"
          fill="none"
        />
      </g>
    ) : (
      <g>
        {Array.from(
          { length: Math.max(2, Math.floor(patch.food * 8)) },
          (_, i) => {
            const x = 35 + ((i * 97) % 710),
              y = 235 + (i % 3) * 34;
            return (
              <g key={i}>
                <path
                  d={`M${x} 430q13-83 0-${430 - y}`}
                  stroke="#668654"
                  strokeWidth="6"
                  fill="none"
                />
                <path d={`m${x} 355q-33-40-43-13 10 25 43 13`} fill="#829d61" />
                {[0, 72, 144, 216, 288].map((angle) => (
                  <ellipse
                    key={angle}
                    cx={x}
                    cy={y - 13}
                    rx="12"
                    ry="21"
                    transform={`rotate(${angle} ${x} ${y})`}
                    fill={i % 2 ? "#c5b7bf" : "#cfbc83"}
                  />
                ))}
                <circle cx={x} cy={y} r="10" fill="#9c8a50" />
              </g>
            );
          },
        )}
      </g>
    );
  if (a.speciesId === "octopus")
    return (
      <g>
        <path d="M0 356q28-108 135-99 81-12 129 99l-19 55H0Z" fill="#688e88" />
        <path
          d="M41 355q1-62 66-66 72-1 86 68Z"
          fill={r[`den:${n.id}`] > 0 ? "#1f5352" : "#345c58"}
        />
        {a.ageDays < 60 &&
          [35, 95, 145, 645, 735].map((x, i) => (
            <g key={x} fill="#cadbaf" opacity=".5">
              <circle cx={x} cy={185 + ((i * 31) % 120)} r="4" />
              <path
                d={`m${x - 4} ${190 + ((i * 31) % 120)} 4 6 4-6`}
                fill="none"
                stroke="#bbd8bd"
              />
            </g>
          ))}
        <path
          d="M674 447q-60-78-10-130t-9-80m60 218q-30-80 6-150"
          fill="none"
          stroke="#548f74"
          strokeWidth="10"
        />
      </g>
    );
  if (a.speciesId === "bullfrog" || a.speciesId === "mallard")
    return (
      <g>
        <path
          d="M0 260q165-40 335 8t465-5v197H0Z"
          fill="#719f95"
          opacity=".8"
        />
        <path
          d="M0 401q148-64 297 26l27 33H0Zm593 59q62-111 207-88v88"
          fill="#657e54"
        />
        {[36, 68, 125, 678, 711, 753].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} 401q-9-85 2-${130 + (i % 3) * 18}`}
              stroke="#8b9a60"
              strokeWidth="5"
              fill="none"
            />
            <path d={`m${x} 332q-38-38-29-62 33 23 29 62`} fill="#93a66b" />
          </g>
        ))}
        <ellipse cx="190" cy="345" rx="50" ry="15" fill="#9eae70" />
        <path
          d="m157 345 34-10 25 12"
          fill="none"
          stroke="#708c63"
          strokeWidth="2"
        />
      </g>
    );
  if (a.speciesId === "seal")
    return (
      <g>
        <path
          d="M0 311q82-77 191-32l95 112H0Zm516 149q55-156 171-136 64-47 113-17v153"
          fill="#718786"
        />
        <path d="M0 409q198-28 332 5t468-9v55H0Z" fill="#7ba5a0" />
        <path
          d="M0 420q178-28 341 0t459-7"
          stroke="#c5d7c9"
          strokeWidth="5"
          fill="none"
          opacity=".65"
        />
      </g>
    );
  if (a.speciesId === "robin" && n.id === "home")
    return (
      <g stroke="#a39265" strokeWidth="5" fill="none">
        <path
          d="M197 338q160 90 320-3-25 113-161 104-128-3-159-101Z"
          fill="#6f6d48"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${195 + i * 4} ${345 + i * 13}q162 69 315-5m-250-4 30 55m30-62 29 68m35-69 28 59`}
          />
        ))}
      </g>
    );
  if (
    ["rabbit", "fox", "meerkat"].includes(a.speciesId) &&
    ["home", "shade"].includes(n.id)
  )
    return (
      <g>
        <path d="M0 460V245q104-78 232-17l28 232" fill="#786b4b" />
        <path d="M0 366q61-124 146-64l16 158H0Z" fill="#2f4531" />
        <path
          d="m0 247 94-12 87 11-12 34m-160 104 20-27 7 50"
          fill="none"
          stroke="#9a8b60"
          strokeWidth="6"
        />
        {a.speciesId === "fox" && (r[`cache:${n.id}`] ?? 0) > 0 && (
          <g>
            <path d="M618 389q44-52 99 1Z" fill="#ac9668" />
            <path
              d="m649 377 16-17 18 8"
              fill="none"
              stroke="#d0bb86"
              strokeWidth="4"
            />
          </g>
        )}
      </g>
    );
  if (a.speciesId === "raccoon" && n.id === "home")
    return (
      <g>
        <path d="M0 0h215q-34 150 20 460H0Z" fill="#60704c" />
        <ellipse cx="135" cy="250" rx="78" ry="112" fill="#263f30" />
        <path
          d="m50 38 16 97m112-80-9 79M38 358l18 74m135-65 21 88"
          stroke="#86916a"
          strokeWidth="9"
          fill="none"
        />
      </g>
    );
  if (a.speciesId === "elephant" && n.id === "shade")
    return (
      <g fill="#375b40" opacity=".8">
        <path d="M0 0h280q19 96-74 97-97 81-206 1Z" />
        <path d="M0 14q87 51 81 446H43Q54 200 0 170Z" />
      </g>
    );
  return (
    <g opacity=".7" fill="#8d9d63">
      {Array.from(
        { length: Math.max(2, Math.floor(patch.food * 7)) },
        (_, i) => (
          <path
            key={i}
            d={`m${28 + i * 110} 395q-19-53 0-72 28 34 0 72m0-24q-40-24-42-8 17 20 42 8`}
          />
        ),
      )}
    </g>
  );
}
