const BaymaxLogo = ({ size = 40 }) => (
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
    <ellipse cx="60" cy="108" rx="30" ry="6" fill="#fca5a5" opacity="0.4"/>
    <circle cx="22" cy="52" r="10" fill="#ef4444"/>
    <circle cx="98" cy="52" r="10" fill="#ef4444"/>
    <circle cx="60" cy="55" r="44" fill="#ef4444"/>
    <circle cx="60" cy="53" r="36" fill="white"/>
    <rect x="24" y="51" width="72" height="3" rx="1.5" fill="#e2e8f0"/>
    <ellipse cx="44" cy="44" rx="7" ry="7" fill="#1e293b"/>
    <circle cx="41.5" cy="41.5" r="2" fill="white"/>
    <circle cx="46" cy="40" r="1" fill="white" opacity="0.6"/>
    <ellipse cx="76" cy="44" rx="7" ry="7" fill="#1e293b"/>
    <circle cx="73.5" cy="41.5" r="2" fill="white"/>
    <circle cx="78" cy="40" r="1" fill="white" opacity="0.6"/>
    <path d="M46 66 Q60 72 74 66" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <rect x="55" y="78" width="10" height="3" rx="1.5" fill="#ef4444"/>
    <rect x="58.5" y="74.5" width="3" height="10" rx="1.5" fill="#ef4444"/>
    <ellipse cx="45" cy="30" rx="8" ry="4" fill="white" opacity="0.15" transform="rotate(-20 45 30)"/>
  </svg>
);

export default BaymaxLogo;