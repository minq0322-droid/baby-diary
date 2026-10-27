import { useId } from 'react';

function Flower({ lit, day }: { lit: boolean; day: number }) {
  return (
    <g
      className="day-mark"
      transform={`translate(${7 + day * 9.8} ${166 - 23 * Math.sin((day / 29) * Math.PI)})`}
    >
      <path
        d={`M0 0q${day % 2 ? 1.1 : -1.1} 4 0 ${6 + (day % 3)}`}
        fill="none"
        stroke="#8c8d78"
        strokeWidth=".75"
      />
      {lit ? (
        <g>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cy="-2.15"
              rx="1.5"
              ry="2.15"
              fill={['#fff5e8', '#ffe9c1', '#fce0e3'][day % 3]}
              transform={`rotate(${angle})`}
            />
          ))}
          <circle r="1.15" fill="#d3a573" />
        </g>
      ) : (
        <path
          d="M0 1C-3-1-1.8-3.3 0-5C1.8-3.3 3-1 0 1Z"
          fill="#d0b5ad"
          stroke="#9e8c8d"
          strokeWidth=".5"
        />
      )}
    </g>
  );
}

function Seed({ lit, day }: { lit: boolean; day: number }) {
  return (
    <g className="day-mark" transform={`rotate(${day * 12} 110 110)`}>
      <path
        d="M110 53V23"
        stroke={lit ? '#fffdf2' : '#f7f9eb'}
        strokeOpacity={lit ? 0.9 : 0.4}
        strokeWidth={lit ? 0.8 : 0.65}
      />
      {lit && (
        <g transform="translate(110 23)">
          <path
            transform="scale(.88)"
            d="M0 0L-6-5M0 0L-4-8M0 0V-9M0 0L4-8M0 0L6-5M0 0L-7-1M0 0L7-1"
            stroke="#fffdf1"
            fill="none"
            strokeLinecap="round"
            strokeWidth=".65"
          />
        </g>
      )}
    </g>
  );
}

export function DayMarks({ days, style }: {
  days: boolean[];
  style: 'sunset' | 'dandelion';
}) {
  const fluff = useId();
  return (
    <svg
      className={`day-art ${style}-art`}
      viewBox={style === 'sunset' ? '0 0 300 198' : '0 0 220 220'}
      aria-hidden="true"
    >
      {style === 'sunset' ? (
        <ellipse cx="150" cy="64" rx="112" ry="106" fill="url(#warm-glow)" />
      ) : (
        <>
          <defs>
            <radialGradient id={fluff}>
              <stop stopColor="#fffbe4" stopOpacity="0" />
              <stop offset=".72" stopColor="#fffbe4" stopOpacity=".12" />
              <stop offset="1" stopColor="#fffbe4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="110" cy="110" r="108" fill={`url(#${fluff})`} />
        </>
      )}
      <g className="day-marks">{days.map((lit, day) => style === 'sunset' ? (
        <Flower key={day} lit={lit} day={day} />
      ) : (
        <Seed key={day} lit={lit} day={day} />
      ))}</g>
    </svg>
  );
}
