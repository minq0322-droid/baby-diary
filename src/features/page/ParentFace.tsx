export function ParentFace({ author }: { author: 'mom' | 'dad' }) {
  return (
    <svg className="parent-face" viewBox="0 0 40 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {author === 'mom' ? (
        <path d="M9 29C2 33 5 18 5 14 5 1 32 0 34 14l1 17-7-2M9 17Q16 14 18 8q4 8 13 8" />
      ) : <path d="M8 18C3 7 11 3 17 5q12-5 16 7l-2 7M9 13l5-3 4 3 5-4 7 5" />}
      <path d="M9 17C7 29 13 34 20 34s13-7 11-17M14 21v1M25 21v1M16 27q4 3 8-.3" />
      {author === 'dad' && <path d="M10 20q4-3 8 0v4h-7ZM22 20q4-3 8 0l-1 4h-7ZM18 21h4" />}
      <path className="parent-underline" d="M8 40q11-2 25 .2" />
    </svg>
  );
}
