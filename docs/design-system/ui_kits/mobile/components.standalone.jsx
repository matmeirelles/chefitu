// Chefitu — shared mobile UI components.
// Loaded after React + ios-frame.jsx.
// Exports to window so subsequent <script type="text/babel"> files can use them.

const C = {
  marrom: '#4A2C1A',
  marromSoft: '#6B4530',
  marromFaint: 'rgba(74, 44, 26, 0.10)',
  creme: '#FFF6E9',
  cremeDeep: '#FBEFDC',
  laranja: '#FF8A2B',
  laranjaSoft: '#FFE3C7',
  laranjaDark: '#E5751A',
  verdeFolha: '#7DBA4D',
  verdeDark: '#5E9633',
  salvia: '#CFE2CF',
  salviaDeep: '#B8D1B8',
  verdeForest: '#2F5A1A',
  bege: '#F6EAD7',
  begeDeep: '#EDDCBF',
  coracao: '#FF6B2C',
  white: '#FFFFFF',
};

const FONT_DISPLAY = '"Baloo 2", system-ui, sans-serif';
const FONT_UI = '"Nunito", system-ui, -apple-system, sans-serif';

// Top inset to clear iOS status bar + Dynamic Island
const SAFE_TOP = 56;

// ────────────────────────────────────────────────────────────
// Icon — thin wrapper around inline SVGs (Lucide-flavoured)
// ────────────────────────────────────────────────────────────
function Icon({ name, size = 22, color = C.marrom, stroke = 2.2 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home:      <><path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    heart:     <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus:     <line x1="5" y1="12" x2="19" y2="12"/>,
    chevright: <polyline points="9 18 15 12 9 6"/>,
    chevleft:  <polyline points="15 18 9 12 15 6"/>,
    chevdown:  <polyline points="6 9 12 15 18 9"/>,
    bell:      <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    clock:     <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    star:      <polygon points="12 2 15 9 22 9.5 17 14 18.5 21 12 17 5.5 21 7 14 2 9.5 9 9 12 2"/>,
    pot:       <><path d="M5 9h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 9z"/><path d="M3 9h18"/><path d="M9 5c0-1 1-2 3-2s3 1 3 2"/></>,
    leaf:      <><path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 8-7s8 3 8 8a7 7 0 0 1-7 7z"/><path d="M11 20c0-7 4-12 9-12"/></>,
    bookmark:  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>,
    shoppingbag: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    camera:    <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    sliders:   <><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><circle cx="6" cy="12" r="2"/><circle cx="13" cy="6" r="2"/><circle cx="16" cy="18" r="2"/></>,
    grid:      <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></>,
    zap:       <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    flame:     <path d="M12 2c1 4 5 6 5 11a5 5 0 1 1-10 0c0-3 2-4 3-6 .5 1 2 1 2-5z"/>,
    check:     <polyline points="20 6 9 17 4 12"/>,
    x:         <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>,
    arrowleft: <><line x1="20" y1="12" x2="4" y2="12"/><polyline points="10 18 4 12 10 6"/></>,
    arrowright:<><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></>,
    share:     <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    more:      <><circle cx="5" cy="12" r="1.5" fill={color}/><circle cx="12" cy="12" r="1.5" fill={color}/><circle cx="19" cy="12" r="1.5" fill={color}/></>,
    bookmark2: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>,
    refresh:   <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    sparkles:  <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {paths[name]}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Buttons
// ────────────────────────────────────────────────────────────
function Button({ children, kind = 'primary', icon, iconRight, full, onClick, style = {} }) {
  const base = {
    border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, padding: '0 22px', borderRadius: 999, fontFamily: FONT_UI, fontWeight: 700, fontSize: 15,
    transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1), box-shadow 150ms cubic-bezier(0.4,0,0.2,1)',
    width: full ? '100%' : undefined,
  };
  const kinds = {
    primary:   { background: C.laranja, color: 'white', boxShadow: '0 6px 16px rgba(255, 138, 43, 0.32)' },
    secondary: { background: 'transparent', color: C.marrom, border: `1.5px solid ${C.marrom}` },
    tertiary:  { background: C.bege, color: C.marrom },
    ghost:     { background: 'transparent', color: C.marrom },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...kinds[kind], ...style }}>
      {icon && <Icon name={icon} size={18} color={kind === 'primary' ? 'white' : C.marrom} stroke={2.4} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} color={kind === 'primary' ? 'white' : C.marrom} stroke={2.4} />}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Top app bar (greeting variant + plain variant)
// ────────────────────────────────────────────────────────────
function GreetingBar({ onBell, big = false }) {
  if (big) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SAFE_TOP + 4}px 20px 16px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <img src={(window.__resources||{}).mascot} style={{ height: 88, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: C.marrom, lineHeight: 1.1 }}>
              Olá, Chefitu! <span style={{ display: 'inline-block', transform: 'rotate(-12deg)' }}>👋</span>
            </div>
            <div style={{ fontSize: 15, color: C.marromSoft, lineHeight: 1.3, marginTop: 4 }}>O que vamos cozinhar hoje?</div>
          </div>
        </div>
        <button onClick={onBell} style={{ width: 44, height: 44, borderRadius: 999, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)', position: 'relative', cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start', marginTop: 18 }}>
          <Icon name="bell" size={20} stroke={2.2} />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 999, background: C.coracao, border: '2px solid white' }}></span>
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SAFE_TOP}px 20px 12px` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={(window.__resources||{}).mascot} style={{ height: 40 }} />
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: C.marrom, lineHeight: 1.05 }}>
            Olá, Chefitu! <span style={{ display: 'inline-block', transform: 'rotate(-12deg)' }}>👋</span>
          </div>
          <div style={{ fontSize: 12, color: C.marromSoft, lineHeight: 1.2, marginTop: 2 }}>O que vamos cozinhar hoje?</div>
        </div>
      </div>
      <button onClick={onBell} style={{ width: 42, height: 42, borderRadius: 999, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)', position: 'relative', cursor: 'pointer' }}>
        <Icon name="bell" size={20} stroke={2.2} />
        <span style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 999, background: C.coracao, border: '2px solid white' }}></span>
      </button>
    </div>
  );
}

function TitleBar({ title, onBack, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: `${SAFE_TOP}px 16px 8px`, gap: 8 }}>
      <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 999, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)', cursor: 'pointer' }}>
        <Icon name="chevleft" size={20} stroke={2.4} />
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: C.marrom }}>{title}</div>
      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{right}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Bottom nav — 4 tabs + Chefitu mascot in the center
// ────────────────────────────────────────────────────────────
function BottomNav({ active = 'home', onChange }) {
  const items = [
    { id: 'home',    label: 'Início',    icon: 'home' },
    { id: 'favs',    label: 'Favoritos', icon: 'heart' },
    { id: 'chefitu', label: 'Chefitu',   chefitu: true },
    { id: 'list',    label: 'Lista',     icon: 'shoppingbag' },
    { id: 'profile', label: 'Perfil',    icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30,
      background: 'white',
      borderTop: '1px solid rgba(74,44,26,0.10)',
      padding: '8px 12px 22px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
    }}>
      {items.map(it => {
        if (it.chefitu) {
          const isActive = active === 'chefitu';
          return (
            <div key={it.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button onClick={() => onChange?.(it.id)} style={{
                width: 56, height: 56, borderRadius: 999,
                background: 'linear-gradient(180deg, #FF9F4D 0%, #FF7C12 100%)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive
                  ? '0 6px 14px rgba(255, 138, 43, 0.42), 0 0 0 3px ' + C.laranjaSoft
                  : '0 6px 14px rgba(255, 138, 43, 0.42)',
                marginTop: -22, cursor: 'pointer',
              }}>
                <img src={(window.__resources||{}).mascot} style={{ height: 42, filter: 'drop-shadow(0 1px 2px rgba(74,44,26,0.18))' }} />
              </button>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.laranja, marginTop: 4, fontFamily: FONT_UI }}>{it.label}</span>
            </div>
          );
        }
        const isActive = active === it.id;
        return (
          <button key={it.id} onClick={() => onChange?.(it.id)} style={{
            border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, padding: '6px 8px 0', flex: 1, cursor: 'pointer',
            color: isActive ? C.laranja : C.marromSoft, fontFamily: FONT_UI,
          }}>
            <Icon name={it.icon} size={22} color={isActive ? C.laranja : C.marromSoft} stroke={2.2} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Search bar (mobile)
// ────────────────────────────────────────────────────────────
function SearchBar({ value, placeholder = 'Buscar receitas, ingredientes…', big = false }) {
  if (big) {
    return (
      <div style={{
        background: 'white', height: 60, borderRadius: 22, display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 12, boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)',
      }}>
        <Icon name="search" size={22} color={C.marrom} stroke={2.4} />
        <span style={{ flex: 1, fontSize: 15, color: value ? C.marrom : C.marromSoft, fontFamily: FONT_UI, fontWeight: value ? 600 : 400 }}>{value || placeholder}</span>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: C.bege, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sliders" size={18} stroke={2.2} />
        </div>
      </div>
    );
  }
  return (
    <div style={{
      background: 'white', height: 50, borderRadius: 18, display: 'flex', alignItems: 'center',
      padding: '0 14px', gap: 10, boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)',
    }}>
      <Icon name="search" size={20} color={C.marromSoft} stroke={2.2} />
      <span style={{ flex: 1, fontSize: 14, color: value ? C.marrom : C.marromSoft, fontFamily: FONT_UI, fontWeight: value ? 600 : 400 }}>{value || placeholder}</span>
      <div style={{ width: 30, height: 30, borderRadius: 10, background: C.bege, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="sliders" size={15} stroke={2.2} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Recipe cards
// ────────────────────────────────────────────────────────────
function RecipeCard({ title, tagline, time, rating, ratings, fav, image, placeholder, tags = [], onClick }) {
  const bg = placeholder
    ? placeholder.gradient
    : image;
  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(74, 44, 26, 0.08)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {placeholder && (
          <span style={{ fontSize: 56, filter: 'drop-shadow(0 2px 4px rgba(74,44,26,0.15))' }}>{placeholder.emoji}</span>
        )}
        <div style={{
          position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 999,
          background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {fav
            ? <Icon name="heart" size={16} color={C.coracao} stroke={0} />
            : <Icon name="heart" size={16} color={C.marrom} stroke={2} />}
          {fav && <svg style={{ position: 'absolute' }} width="16" height="16" viewBox="0 0 24 24" fill={C.coracao}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.marrom, lineHeight: 1.2,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: 'calc(2 * 1.2em)',
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: C.marromSoft, fontWeight: 600, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={13} stroke={2.4} color={C.marromSoft} /> {time}
          </span>
          {rating && <span>★ {rating} {ratings && <span style={{ opacity: 0.7 }}>({ratings})</span>}</span>}
        </div>
        {tagline && <div style={{ fontSize: 12, color: C.marromSoft, lineHeight: 1.4 }}>{tagline}</div>}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {tags.map(t => <Tag key={t.label} {...t} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactRecipeCard({ title, time, rating, fav, image, placeholder, tag, onClick }) {
  const bg = placeholder ? placeholder.gradient : image;
  return (
    <div onClick={onClick} style={{
      background: 'white', borderRadius: 18, padding: 10, display: 'flex', gap: 12, alignItems: 'center',
      boxShadow: '0 2px 8px rgba(74, 44, 26, 0.06)', cursor: 'pointer',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 14, background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {placeholder && <span style={{ fontSize: 30, filter: 'drop-shadow(0 1px 2px rgba(74,44,26,0.15))' }}>{placeholder.emoji}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.marrom, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: C.marromSoft, fontWeight: 600, marginTop: 3 }}>
          <span>★ {rating}</span><span>{time}</span>
        </div>
        {tag && <div style={{ marginTop: 4 }}><Tag {...tag} /></div>}
      </div>
      <Icon name="heart" size={18} color={fav ? C.coracao : C.marrom} stroke={fav ? 0 : 2} />
    </div>
  );
}

// Recipe placeholder — brand-styled gradient + emoji.
function recipePlaceholder({ emoji = '🍳', tint = 'orange' }) {
  const palettes = {
    orange: ['#FFD7A0', '#FF9F5B'],
    yellow: ['#FBE38A', '#E8B856'],
    green:  ['#C5E4A1', '#7DBA4D'],
    sage:   ['#DEEBDA', '#A8C99A'],
    red:    ['#F8C9B9', '#E27B5F'],
    beige:  ['#F0DDB8', '#D8B373'],
    brown:  ['#D9B58C', '#A57843'],
    purple: ['#E2C9D9', '#A87FA0'],
  };
  const [a, b] = palettes[tint] || palettes.orange;
  return { emoji, gradient: `linear-gradient(135deg, ${a}, ${b})` };
}

function Tag({ label, kind = 'orange' }) {
  const kinds = {
    orange: { background: C.laranjaSoft, color: C.marrom },
    green: { background: C.salviaDeep, color: C.verdeForest },
    brown: { background: C.bege, color: C.marrom },
  };
  return <span style={{ ...kinds[kind], fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, fontFamily: FONT_UI }}>{label}</span>;
}

// ────────────────────────────────────────────────────────────
// Category chip row
// ────────────────────────────────────────────────────────────
function CategoryChips({ items, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
      {items.map(it => {
        const isActive = active === it.id;
        return (
          <button key={it.id} onClick={() => onChange?.(it.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px 8px 10px',
            borderRadius: 999, background: isActive ? C.laranjaSoft : 'white',
            border: `1.5px solid ${isActive ? C.laranja : 'transparent'}`,
            color: isActive ? C.laranja : C.marrom,
            fontFamily: FONT_UI, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(74, 44, 26, 0.06)', cursor: 'pointer', flexShrink: 0,
          }}>
            <Icon name={it.icon} size={16} color={isActive ? C.laranja : C.verdeDark} stroke={2.2} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// Section header
function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, color: C.marrom, margin: 0 }}>{title}</h2>
      {action && <span style={{ fontSize: 12, fontWeight: 700, color: C.laranja }}>{action}</span>}
    </div>
  );
}

// Export to window so sibling babel scripts can use them
Object.assign(window, {
  C, FONT_DISPLAY, FONT_UI, SAFE_TOP,
  Icon, Button, GreetingBar, TitleBar, BottomNav, SearchBar,
  RecipeCard, CompactRecipeCard, Tag, CategoryChips, SectionHeader, recipePlaceholder,
});
