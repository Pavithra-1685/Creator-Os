const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function IconBase({ children, size = 18, title, ...props }) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...strokeProps}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export function BarChartIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-3" />
    </IconBase>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </IconBase>
  );
}

export function BotIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <path d="M12 4v4" />
      <path d="M9 13h.01" />
      <path d="M15 13h.01" />
      <path d="M9 17h6" />
    </IconBase>
  );
}

export function BriefcaseIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </IconBase>
  );
}

export function CalendarIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 11h18" />
    </IconBase>
  );
}

export function CrownIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 7l5 4 4-7 4 7 5-4-2 12H5L3 7z" />
      <path d="M5 19h14" />
    </IconBase>
  );
}

export function FileTextIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </IconBase>
  );
}

export function HandshakeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8 12l3 3a2 2 0 0 0 3 0l2-2" />
      <path d="M3 12l4-4 4 4" />
      <path d="M21 12l-4-4-4 4" />
      <path d="M7 8h10" />
      <path d="M7 16h10" />
    </IconBase>
  );
}

export function ImageIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="10" r="1.5" />
      <path d="M21 16l-5-5L5 19" />
    </IconBase>
  );
}

export function LogOutIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function PlusIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function ScissorsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="7" r="3" />
      <circle cx="6" cy="17" r="3" />
      <path d="M8.5 8.5L20 20" />
      <path d="M8.5 15.5L20 4" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16l5 5" />
    </IconBase>
  );
}

export function TargetIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </IconBase>
  );
}

export function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

export function VideoIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3z" />
    </IconBase>
  );
}

export function WalletIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" />
      <path d="M16 13h4" />
      <path d="M16 13a1 1 0 1 0 0 .01" />
    </IconBase>
  );
}
