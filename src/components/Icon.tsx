const badgePaths = {
  vax: 'M7 20 20 7M15 4l5 5M4 17l5 5M17 2l5 5M10 11l3 3M7 14l3 3',
  fever: 'M10 15V5a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0M12 9v9M17 6h3M17 10h2',
  hosp: 'M4 21V8h16v13H4M9 8V3h6v5M12 11v6M9 14h6',
  first: 'm12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z',
  growth:
    'M12 22V10M12 14C2 15 2 5 4 4c7-1 8 5 8 10ZM12 10c0-7 5-9 9-7 1 6-3 9-9 7',
  food: 'M6 2v8M3 2v5a3 3 0 0 0 6 0V2M6 10v12M17 2v20M17 2c-5 5-4 10 0 10',
  sleep: 'M19 16A9 9 0 0 1 8 3a9 9 0 1 0 11 13ZM17 3v5M15 5h5',
  med: 'm8 4 12 12a4 4 0 0 1-6 6L2 10a4 4 0 0 1 6-6ZM7 15l6-6',
  prenatal: 'M12 21C-3 11 4 0 12 7 20 0 27 11 12 21Z',
};

export function Icon({
  name,
}: {
  name:
    | 'list'
    | 'home'
    | 'calendar'
    | 'settings'
    | 'search'
    | 'arrow'
    | 'back'
    | 'star'
    | 'speech'
    | 'heart'
    | 'heartFilled'
    | keyof typeof badgePaths;
}) {
  const heart =
    'M12 20.5C8.8 18 2.3 13.7 3 8.5 3.5 3.4 9 3.1 12.2 7.2 15.3 2.8 21 4.1 21.1 8.9 21.5 13.5 15.8 18.4 12 20.5Z';
  const paths = {
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    speech: (
      <path d="M5 4.8Q12 3.1 19 5.2C23 8 21.3 15.8 18 17Q13 18.2 8.5 16.9L4 20l.6-5C1.5 12.1 2 7 5 4.8Z" />
    ),
    heart: <path d={heart} />,
    heartFilled: <path d={heart} fill="currentColor" />,
    star: (
      <path
        transform="scale(.75)"
        d="M16 3 L20 12 L30 13 L23 20 L25 30 L16 25 L6 29 L8 19 L1 12 L12 11 Z"
      />
    ),
    home: (
      <>
        <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19 15 1 .6a1.7 1.7 0 1 1-2.4 2.4l-.6-1a7.5 7.5 0 0 1-2.6 1.1v1.2a1.7 1.7 0 1 1-3.4 0v-1.2a7.5 7.5 0 0 1-2.6-1.1l-.6 1A1.7 1.7 0 1 1 5.4 15l1-.6a7.5 7.5 0 0 1 0-6.8l-1-.6a1.7 1.7 0 1 1 2.4-2.4l.6 1a7.5 7.5 0 0 1 2.6-1.1V3.3a1.7 1.7 0 1 1 3.4 0v1.2a7.5 7.5 0 0 1 2.6 1.1l.6-1A1.7 1.7 0 1 1 20 7l-1 .6a7.5 7.5 0 0 1 0 6.8Z" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      stroke="currentColor"
      fill="none"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name in badgePaths ? (
        <path d={badgePaths[name as keyof typeof badgePaths]} />
      ) : (
        paths[name as keyof typeof paths]
      )}
    </svg>
  );
}
