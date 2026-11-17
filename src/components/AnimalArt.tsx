// Original vector wildlife artwork. Shapes are stylized, not anatomical reference plates.
function Eye({
  x,
  y,
  closed = false,
}: {
  x: number;
  y: number;
  closed?: boolean;
}) {
  return closed ? (
    <path
      d={`m${x - 4} ${y}q4 4 8 0`}
      fill="none"
      stroke="#263629"
      strokeWidth="2"
    />
  ) : (
    <g>
      <circle cx={x} cy={y} r="3.6" fill="#172820" />
      <circle cx={x + 1} cy={y - 1} r="1.1" fill="#e8ecd5" />
    </g>
  );
}
export function AnimalArt({
  species,
  stage = "Adult",
  ageDays = 9999,
  sex = "Female",
  stores = {},
}: {
  species: string;
  stage?: string;
  ageDays?: number;
  sex?: string;
  stores?: Record<string, number>;
}) {
  const brood = ["Egg", "Larva", "Pupa"].includes(stage);
  if (brood) {
    if (species === "bullfrog")
      return (
        <g fill="#c3d7a4" stroke="#719786" strokeWidth="2">
          {[
            [65, 94],
            [91, 78],
            [118, 100],
            [86, 120],
            [135, 79],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="20" opacity=".5" />
              <circle cx={x} cy={y} r="6" fill="#354a36" stroke="none" />
            </g>
          ))}
        </g>
      );
    return (
      <g>
        <ellipse
          cx="99"
          cy="133"
          rx="70"
          ry="19"
          fill={species === "bumblebee" ? "#92714a" : "#8d7454"}
        />
        <path
          d="M40 123q-8-40 12-55 50-24 94 2 24 20 7 54"
          fill={species === "bumblebee" ? "#b19358" : "#715942"}
          stroke="#d1b879"
          strokeWidth="3"
        />
        {stage === "Egg" ? (
          <ellipse
            cx="99"
            cy="97"
            rx="13"
            ry="25"
            fill="#eddfb5"
            transform="rotate(28 99 97)"
          />
        ) : (
          <g fill="#e4d3a6" stroke="#af976d" strokeWidth="2">
            <path d="M73 94q-4-26 22-28 34 0 33 35-3 30-30 26-24-1-25-22 2-19 19-16 13 3 7 15" />
            {stage === "Larva" && (
              <path d="m82 78 8 10m4-18 5 17m10-14 2 18" fill="none" />
            )}
            {stage === "Pupa" && (
              <path d="M75 89q26-5 49 5m-46 14 43 3" fill="none" />
            )}
          </g>
        )}
      </g>
    );
  }
  if (species === "wolf" && ageDays < 14)
    return (
      <g stroke="#46534b" strokeWidth="2">
        <path
          d="M34 115q-12-35 22-42 31-9 51 17 19 35-15 44l-44 2q-25-2-22-13"
          fill="#a7aa97"
        />
        <path d="M105 92q15-29 44-17l16 14 14 13-27 14-35-2" fill="#b7b69f" />
        <path
          d="m128 79 3-16 14 13m-12 33 17 15-35 1m-71-7-11-13-15 8 22 12"
          fill="#919b88"
        />
        <Eye x={150} y={94} closed />
        <circle cx="175" cy="102" r="3" fill="#293b30" />
      </g>
    );
  if (species === "bumblebee")
    return (
      <g stroke="#30382e" strokeWidth="2">
        <path
          d="M83 76Q27 14 48 14q39-5 60 61m0-2q2-67 31-61 31 12-18 71"
          fill="#c7e0d9"
          opacity=".7"
        />
        <path
          d="m67 113-19 19m40-14-7 22m27-22 15 22m4-31 24 15m-10-37 17-28-3-13m-25 30 2-26-11-12"
          fill="none"
          strokeWidth="4"
        />
        <ellipse cx="87" cy="98" rx="53" ry="35" fill="#343a2c" />
        <path
          d="M59 68q-15 31 2 59l15 3q-17-34-2-65Zm35-3q19 34 1 67l17-3q21-32 0-57Z"
          fill="#d2b659"
          stroke="none"
        />
        <path
          d="M38 83q-14 20 5 34l17 7q-16-26-4-48"
          fill="#e4d8ad"
          stroke="none"
        />
        <ellipse cx="134" cy="91" rx="24" ry="25" fill="#343a2c" />
        <Eye x={144} y={84} />
        <path d="m152 100 12 7-13 1" fill="#3a3e2a" />
        {(stores.pollen ?? 0) > 0 && (
          <g fill="#ddae4b" stroke="#a37b32">
            <ellipse cx="76" cy="131" rx="10" ry="9" />
            <ellipse cx="123" cy="131" rx="10" ry="9" />
          </g>
        )}
      </g>
    );
  if (species === "rabbit")
    return (
      <g stroke="#515449" strokeWidth="2">
        <ellipse cx="83" cy="106" rx="48" ry="33" fill="#a89a7c" />
        <ellipse cx="53" cy="117" rx="21" ry="22" fill="#b3a587" />
        <path d="m58 132 39 1-6-11m30-4-2 14 22 0" fill="#c1b397" />
        <circle cx="31" cy="107" r="12" fill="#e4dcc0" />
        <ellipse cx="126" cy="86" rx="30" ry="27" fill="#b9aa8b" />
        <path
          d="M115 67q-29-58-9-59 16 4 24 55m1-1q0-56 18-58 19 8-3 66"
          fill="#ae9f83"
        />
        <path d="m114 49-8-30m33 32 9-35" stroke="#c7b09c" strokeWidth="6" />
        <Eye x={137} y={80} closed={ageDays < 9} />
        <path d="m151 91 8 1-5 5-5-3" fill="#9c7560" />
        <path d="m152 97 10 8m-16-6 17 0" strokeWidth="1" />
      </g>
    );
  if (species === "mallard") {
    const duckling = ageDays < 60,
      male = sex === "Male" && !duckling;
    return (
      <g stroke="#5f6046" strokeWidth="2">
        <path
          d="m47 123-20-14 3 19 32 7"
          fill={duckling ? "#9a8553" : "#797c69"}
        />
        <ellipse
          cx="84"
          cy="111"
          rx="48"
          ry="28"
          fill={duckling ? "#d7c478" : "#a29472"}
        />
        <path
          d="M62 98q44-15 52 16-19 18-50 5"
          fill={duckling ? "#a89154" : "#746f58"}
        />
        <path
          d="m89 130 4 16 17-2m4-14 6 14 15-1"
          stroke="#c6a458"
          strokeWidth="4"
        />
        <path
          d="M109 105q4-26 13-36"
          fill="none"
          stroke={male ? "#dbdbc1" : "#c3b17f"}
          strokeWidth="18"
        />
        <circle
          cx="133"
          cy="72"
          r="25"
          fill={male ? "#456d4a" : duckling ? "#e2cf80" : "#aaa080"}
        />
        <path d="m151 78 26 7-26 8-9-9" fill="#c6ad62" />
        <path
          d="m113 65 31-4"
          stroke={duckling ? "#706643" : "#6d705a"}
          strokeWidth="6"
        />
        <Eye x={141} y={70} />
        {!duckling && (
          <path d="m60 104 36 12m-43-2 37 9" stroke="#cbc2a0" strokeWidth="2" />
        )}
      </g>
    );
  }
  if (species === "octopus")
    return (
      <g
        stroke="#79665e"
        strokeWidth="2"
        fill={(stores.camouflage ?? 0) > 35 ? "#8a8d75" : "#bd9674"}
        opacity={ageDays < 60 ? 0.75 : 1}
      >
        <path d="M59 91q-13-54 30-60 50-3 48 49l-8 28-58 5Z" />
        <path
          d="M74 101q-16 42-49 39-24-7 0-14m58-21q1 48-22 55-26 7-24-6m53-47q20 44 5 63-14 18-27 5m30-64q32 20 25 48-9 24-20 13m23-68q31 45 60 36 19-9-2-17m-63-19q42 4 54 30 16 25 31 3m-102-24q-29 20-51 9-17-10-5-14m46 14q39-12 50 2 14 11 24-1"
          strokeWidth="10"
          fill="none"
          stroke={(stores.camouflage ?? 0) > 35 ? "#8a8d75" : "#bc9675"}
        />
        <Eye x={83} y={83} />
        <Eye x={113} y={83} />
        <path
          d="M66 59q8-14 26-14"
          stroke="#dbc4a3"
          fill="none"
          strokeWidth="4"
        />
      </g>
    );
  if (species === "bullfrog" && stage === "Tadpole")
    return (
      <g stroke="#4b6655" strokeWidth="2">
        <path d="M103 89q43-27 82 3-43-3-66 30" fill="#9aaa7e" />
        <ellipse cx="82" cy="102" rx="41" ry="30" fill="#74845e" />
        <Eye x={63} y={90} />
        <path d="M48 111q9 6 18 1" fill="none" />
      </g>
    );
  if (species === "bullfrog")
    return (
      <g stroke="#4d6546" strokeWidth="2">
        <ellipse cx="89" cy="107" rx="48" ry="32" fill="#85965f" />
        <path
          d="M59 98q-41 0-40 27l31 14 32-8m38-32q40 5 38 29l-40 11-26-12"
          fill="#6b8455"
        />
        <path
          d="m70 114-13 31-20-4m72-28 12 30 20-2"
          fill="none"
          stroke="#b0b67d"
          strokeWidth="8"
        />
        <path
          d="M51 86q4-35 32-22 27-17 43 14l-1 26-56 9-23-14"
          fill="#97a56a"
        />
        <circle cx="71" cy="75" r="11" fill="#afbd7d" />
        <circle cx="112" cy="73" r="11" fill="#afbd7d" />
        <Eye x={71} y={75} />
        <Eye x={112} y={73} />
        <path d="m61 99q30 13 57-4" fill="none" />
      </g>
    );
  if (species === "raccoon")
    return (
      <g stroke="#4a524b" strokeWidth="2">
        <path d="M45 110q-37 1-30 27 14 23 47-7" fill="#a2a596" />
        <path
          d="m21 116-3 21m19-24-6 30m18-28-5 25"
          stroke="#596057"
          strokeWidth="10"
        />
        <ellipse cx="85" cy="103" rx="47" ry="32" fill="#9a9f91" />
        <path d="m55 123-3 20 25-2m28-20 6 20 22-1" fill="#697365" />
        <path
          d="m112 73-4-24 22 14 20-9 5 24 6 25-27 19-29-20Z"
          fill="#b9bdab"
        />
        <path d="m108 82 20-2 12-4 14 7-7 16-16-7-15 7Z" fill="#48564b" />
        <Eye x={121} y={85} closed={ageDays < 21} />
        <Eye x={145} y={84} closed={ageDays < 21} />
        <circle cx="135" cy="102" r="4" fill="#354338" />
      </g>
    );
  if (species === "fox")
    return (
      <g stroke="#68583d" strokeWidth="2">
        <path d="M52 106Q12 72 3 92q-6 35 49 42" fill="#bb8955" />
        <path d="M5 93q-5 23 20 31l4-22Z" fill="#dfd7b3" />
        <path
          d="M45 111q-3-42 44-41 31-1 49 28l-3 25-49 1-31-7"
          fill="#c7945c"
        />
        <path d="m54 116-5 32 17-1 7-29m38-1 8 30 14-1-1-34" fill="#6b6650" />
        <path
          d="m111 80 3-40 23 25 19-27 4 41 22 14-29 23-31-6Z"
          fill="#c9965f"
        />
        <path d="m125 91 26 8 29-5-26 20-25-6" fill="#e0d6ae" />
        <Eye x={146} y={82} closed={ageDays < 14} />
        <circle cx="179" cy="95" r="3" fill="#354235" />
      </g>
    );
  if (species === "robin") {
    const young = ageDays < 90;
    return (
      <g stroke="#605b43" strokeWidth="2">
        <path d="m60 122-37 20 9-26 26-15" fill="#716c50" />
        <ellipse cx="96" cy="102" rx="39" ry="41" fill="#9e9470" />
        <path
          d="M88 85q-17 29 1 53 40-2 43-30l-9-28Z"
          fill={young ? "#bcac7a" : "#bb7958"}
        />
        <path d="M66 88q-18 33 15 38l12-21Z" fill="#756f50" />
        <circle cx="116" cy="65" r="27" fill="#a79c77" />
        <path d="m137 67 21 9-22 5" fill="#a39060" />
        <Eye x={124} y={60} closed={stage === "Nestling" && ageDays < 4} />
        <path
          d="m91 137-5 18-14 1m38-21 4 20 13 0"
          fill="none"
          stroke="#665e43"
          strokeWidth="3"
        />
        {young && (
          <path
            d="m75 75 3 1m-1 20 4 2m-5 20 4 2m16-30 4 1"
            stroke="#ded1a3"
            strokeWidth="4"
          />
        )}
      </g>
    );
  }
  if (species === "meerkat")
    return (
      <g stroke="#675d43" strokeWidth="2">
        <path
          d="M77 123q-27 36-58 26"
          fill="none"
          stroke="#9e9169"
          strokeWidth="12"
        />
        <path
          d="M62 124q-3-31 17-57 30-20 45 14l9 55-25 8-33-2Z"
          fill="#b9a87a"
        />
        <path d="M83 84q26-13 27 34l-2 24-24-2Z" fill="#dbcc9e" />
        <path d="m75 134-12 19 30 0m16-15 10 16 23-2" fill="#a3946b" />
        <path
          d="m79 83-19 24 17 8m39-32 17 24-18 10"
          fill="none"
          stroke="#9d8f69"
          strokeWidth="8"
        />
        <ellipse cx="97" cy="58" rx="32" ry="24" fill="#c6b688" />
        <circle cx="70" cy="42" r="8" fill="#8f8461" />
        <circle cx="121" cy="40" r="8" fill="#8f8461" />
        <path d="m75 53 17-1-3 13-13-4m24-9 17-2-2 12-14 3" fill="#5c5f45" />
        <Eye x={84} y={56} closed={ageDays < 14} />
        <Eye x={108} y={55} closed={ageDays < 14} />
        <path d="m92 69 11-1-5 8Z" fill="#4b513c" />
      </g>
    );
  if (species === "seal")
    return (
      <g stroke="#536c6c" strokeWidth="2">
        <path d="M44 111q-29-8-39 14l27 2-13 15 36-12" fill="#7b9898" />
        <path
          d="M34 112q11-39 62-36l30-27 28 6 12 27-22 34-43 17-54-6Z"
          fill="#9eb6b2"
        />
        <path d="M89 107q-8 29 22 40l20-12-22-30" fill="#7f9f9c" />
        <ellipse cx="144" cy="72" rx="28" ry="25" fill="#afc3b9" />
        <Eye x={154} y={65} />
        <circle cx="165" cy="79" r="3" fill="#3a5653" />
        <path d="m157 85 22 4m-25-1 20 10" stroke="#d4ddd0" fill="none" />
        {[
          [65, 101],
          [82, 91],
          [111, 88],
          [60, 118],
          [99, 119],
          [127, 100],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 2 ? 3 : 4}
            fill="#6a8985"
            stroke="none"
          />
        ))}
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
        {ageDays >= 365 && <path d="m160 98 8 9-11-3" fill="#eee3bf" />}
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
        {(stores.leafLoad ?? 0) > 0 && (
          <g
            className="carried-leaves"
            stroke="#a6bf7d"
            strokeWidth="2"
            fill="#739c5b"
          >
            <path d="M151 91q-7-45 51-61 10 54-51 61Z" />
            <path d="m151 91 38-47" fill="none" />
          </g>
        )}
        <path d="m149 96 12-3m-11 6 9 5" fill="none" />
      </g>
    );
  return null;
}
