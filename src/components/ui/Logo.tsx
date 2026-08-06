export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Meditate logo — open Bible"
    >
      <rect width="64" height="64" rx="12" fill="#B8860B" />
      <path
        d="M32 14C26 14 18 18 18 24V48C18 48 24 44 32 44C40 44 46 48 46 48V24C46 18 38 14 32 14Z"
        fill="#FAF8F5"
      />
      <path
        d="M32 14V44"
        stroke="#B8860B"
        strokeWidth="1.5"
      />
      <path
        d="M22 28H28M36 28H42M22 34H28M36 34H42"
        stroke="#D4A843"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
