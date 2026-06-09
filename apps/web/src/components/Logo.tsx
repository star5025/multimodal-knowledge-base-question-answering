import { useId } from "react";

type Props = {
  size?: number;
  className?: string;
  ariaLabel?: string;
};

export default function Logo({ size = 32, className, ariaLabel = "Knowledge Base QA logo" }: Props) {
  const gradientId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7" fill={`url(#${gradientId})`} />
      <rect x="7.5" y="8" width="11.5" height="15" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="11" y="10" width="13" height="15" rx="2" fill="#ffffff" />
      <path d="M14 14.5h7M14 18h7M14 21.5h4.5" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="23" r="3.6" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.4" />
    </svg>
  );
}
