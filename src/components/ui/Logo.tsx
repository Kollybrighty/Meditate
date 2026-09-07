export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Meditate logo — studying the Bible together"
    >
      <rect width="64" height="64" rx="12" fill="#B8860B" />
      {/* Left profile, facing the open Bible */}
      <path
        d="M11 31C11 19 18.5 11.5 26 13C29.5 13.8 31.5 16.5 31 20.5C32.8 21.4 34.2 22.8 33.6 24.8C31.6 26.6 28.5 28.2 25.5 30C22.5 32 19.5 35.5 18.5 41L12.5 43C10.5 39 10 35 11 31Z"
        fill="#FAF8F5"
      />
      {/* Right profile, facing the open Bible */}
      <path
        d="M53 31C53 19 45.5 11.5 38 13C34.5 13.8 32.5 16.5 33 20.5C31.2 21.4 29.8 22.8 30.4 24.8C32.4 26.6 35.5 28.2 38.5 30C41.5 32 44.5 35.5 45.5 41L51.5 43C53.5 39 54 35 53 31Z"
        fill="#FAF8F5"
      />
      {/* Open Bible in front */}
      <path
        d="M10 39C16 34.5 24 35.5 32 36.5C40 35.5 48 34.5 54 39V56C46 51.5 40 50.5 32 50.5C24 50.5 18 51.5 10 56V39Z"
        fill="#FAF8F5"
      />
      <path d="M32 36.5V50.5" stroke="#B8860B" strokeWidth="1.5" />
      <path
        d="M16 44H27M16 48H25M37 44H48M39 48H48"
        stroke="#D4A843"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
