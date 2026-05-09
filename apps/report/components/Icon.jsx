export default function Icon({ name, className = "" }) {
  const iconProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  };

  switch (name) {
    case "real-time-people":
      return (
        <svg {...iconProps}>
          <polygon points="13,2 3,14 9,14 9,22 15,10 9,10 13,2"/>
        </svg>
      );

    case "employee-view":
      return (
        <svg {...iconProps}>
          <path d="M20 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M4 21v-2a4 4 0 0 1 3-3.87"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      );

    case "trends":
      return (
        <svg {...iconProps}>
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
          <line x1="2" y1="20" x2="22" y2="20"/>
        </svg>
      );

    case "anomalies":
      return (
        <svg {...iconProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      );

    case "chevron-down":
      return (
        <svg {...iconProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );

    default:
      return null;
  }
}

export function SelectChevron({ className = "h-4 w-4" }) {
  return <Icon name="chevron-down" className={className} />;
}
