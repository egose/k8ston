import { useId } from 'react';

// Brand mark shared with the docs site (website/static/img/favicon.svg):
// green hexagon crystal with a keyhole. Inlined (not <img>) so it stays crisp
// at any size and keeps working where an inline <svg> is expected.
export function K8stonMark({ size = 20, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rim = `kr-rim-${uid}`;
  const facet = `kr-facet-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={rim} x1="34" y1="20" x2="222" y2="236" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A3E635" />
          <stop offset="0.5" stopColor="#ECFDF5" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={facet} x1="50" y1="60" x2="206" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EE7B7" />
          <stop offset="0.5" stopColor="#34D399" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <polygon points="128,20 221.5,74 221.5,182 128,236 34.5,182 34.5,74" fill={`url(#${rim})`} />
      <polygon points="128,38 205.9,83 205.9,173 128,218 50.1,173 50.1,83" fill="#022C22" />
      <g stroke={`url(#${facet})`} strokeWidth="6" opacity="0.55">
        <line x1="128" y1="128" x2="128" y2="38" />
        <line x1="128" y1="128" x2="205.9" y2="173" />
        <line x1="128" y1="128" x2="50.1" y2="173" />
      </g>
      <path
        d="M128 99C117.507 99 109 107.507 109 118C109 125.432 113.266 131.867 119.472 135.017V158C119.472 160.761 121.711 163 124.472 163H131.528C134.289 163 136.528 160.761 136.528 158V135.017C142.734 131.867 147 125.432 147 118C147 107.507 138.493 99 128 99Z"
        fill="#ECFDF5"
      />
      <path
        d="M128 112.5C124.41 112.5 121.5 115.41 121.5 119C121.5 122.59 124.41 125.5 128 125.5C131.59 125.5 134.5 122.59 134.5 119C134.5 115.41 131.59 112.5 128 112.5Z"
        fill="#022C22"
      />
      <circle cx="74" cy="84" r="10" fill="#34D399" stroke="#022C22" strokeWidth="5" />
      <circle cx="182" cy="84" r="10" fill="#A3E635" stroke="#022C22" strokeWidth="5" />
      <circle cx="128" cy="196" r="10" fill="#FBBF24" stroke="#022C22" strokeWidth="5" />
    </svg>
  );
}
