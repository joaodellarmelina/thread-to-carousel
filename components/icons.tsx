import type { CSSProperties } from "react";

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

export function XLogo({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function VerifiedBadge({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" fill="#1d9bf0" className={className} style={style} aria-hidden="true">
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816a3.973 3.973 0 0 0-1.5-1.363 3.9 3.9 0 0 0 .348-1.97 3.986 3.986 0 0 0-.579-1.86 4.02 4.02 0 0 0-1.362-1.36 3.94 3.94 0 0 0-1.859-.577 3.94 3.94 0 0 0-1.969.346A4.032 4.032 0 0 0 11 1.604a4.032 4.032 0 0 0-1.905 1.796 3.94 3.94 0 0 0-1.97-.346 3.94 3.94 0 0 0-1.858.577 4.02 4.02 0 0 0-1.363 1.36 3.986 3.986 0 0 0-.578 1.86c-.02.68.12 1.357.348 1.97a3.973 3.973 0 0 0-1.5 1.363A3.955 3.955 0 0 0 1.604 11c.018.646.215 1.275.57 1.816.354.54.847.982 1.43 1.279a3.94 3.94 0 0 0-.348 1.97c.052.68.286 1.334.678 1.895.393.56.929.996 1.55 1.26.622.264 1.303.34 1.964.222a3.94 3.94 0 0 0 1.756-.834 4.032 4.032 0 0 0 2.796 1.128 4.032 4.032 0 0 0 2.796-1.128 3.94 3.94 0 0 0 1.756.834c.66.118 1.342.042 1.964-.222.622-.264 1.158-.7 1.55-1.26.393-.561.627-1.216.679-1.895a3.94 3.94 0 0 0-.348-1.97 3.958 3.958 0 0 0 1.43-1.28c.355-.54.552-1.169.57-1.815Zm-10.617 3.647-3.593-3.592 1.4-1.4 2.193 2.192 4.807-4.807 1.4 1.4Z" />
    </svg>
  );
}

export function PlayGlyph({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true">
      <path d="M8 5.14v13.72c0 .53.6.85 1.05.56l10.87-6.86a.667.667 0 0 0 0-1.12L9.05 4.58A.667.667 0 0 0 8 5.14Z" />
    </svg>
  );
}
