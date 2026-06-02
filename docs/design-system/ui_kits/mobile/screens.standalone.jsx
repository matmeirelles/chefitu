// Chefitu mobile screens — each `<Screen*>` is a self-contained mobile screen body.
// Lives inside an <IOSDevice> from ios-frame.jsx. Background color: brand cream.

const R = (typeof window !== 'undefined' && window.__resources) || {};
const PASTA_HERO = R.pastaHero;
const MACARRAO = R.macarrao;
const MACARRAO_BIG = R.macarraoBig;
const MACARRAO_THUMB = R.macarraoThumb;
const FRANGO = R.frango;
const PANQUECA = R.panqueca;
const SOPA = R.sopa;
const MASCOT = R.mascot;
const COOKING = R.cooking;
const SPAGHETTI = R.spaghetti;
const TOMATO = R.tomato;
const AVOCADO = R.avocado;
const PANCAKES = R.pancakes;

// Reusable scroll container fitting under top bar, above bottom nav
function ScrollBody({ children, pad = 16, paddingBottom = 96 }) {
  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: `0 ${pad}px ${paddingBottom}px`,
      WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
    }}>{children}</div>
  );
}

// ──────────────────────────────────────────────────────────────
// 1. SPLASH
// ──────────────────────────────────────────────────────────────
function ScreenSplash({ go }) {
  return (
    <div style={{
      flex: 1, background: C.creme, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: `${SAFE_TOP}px 32px 0`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative leaves */}
      <svg style={{ position: 'absolute', top: 80, left: 30, opacity: 0.18 }} width="80" height="80" viewBox="0 0 24 24" fill={C.verdeFolha}>
        <path d="M21 3c-9 0-14 5-14 12 0 2 .5 4 1.5 5.5C10 21 14 19 17 16s5-8 4-13z"/>
      </svg>
      <svg style={{ position: 'absolute', bottom: 200, right: 30, opacity: 0.18 }} width="60" height="60" viewBox="0 0 24 24" fill={C.coracao}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <svg style={{ position: 'absolute', top: 140, right: 40, opacity: 0.18 }} width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={C.marrom} strokeWidth="2" strokeLinecap="round">
        <path d="M11 20A7 7 0 0 1 4 13c0-4 3-7 8-7s8 3 8 8a7 7 0 0 1-7 7z"/>
        <path d="M11 20c0-7 4-12 9-12"/>
      </svg>

      <img src={MASCOT} style={{ height: 200, marginBottom: 14 }} />
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 56, color: C.marrom, lineHeight: 1, marginBottom: 18 }}>
        Chefitu<span style={{ color: C.coracao, fontSize: 36 }}>♡</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: 16, color: C.marrom, fontFamily: FONT_UI, lineHeight: 1.4, maxWidth: 280 }}>
        Receitas que <span style={{ color: C.laranja, fontWeight: 700 }}>acolhem</span>,
        <br />ingredientes que <span style={{ color: C.laranja, fontWeight: 700 }}>conectam</span>.
      </div>
      <div style={{ position: 'absolute', bottom: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', padding: '0 32px' }}>
        <Button kind="primary" full iconRight="arrowright" onClick={() => go('onboarding')}>Vamos começar</Button>
        <div style={{ fontSize: 12, color: C.marromSoft }}>Feito com amor para deixar seu dia mais gostoso.</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. ONBOARDING
// ──────────────────────────────────────────────────────────────
function ScreenOnboarding({ go }) {
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column', padding: `${SAFE_TOP}px 24px 90px`, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => go('home')} style={{ background: 'transparent', border: 'none', color: C.marromSoft, fontFamily: FONT_UI, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Pular</button>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 1.15, color: C.marrom, marginBottom: 28 }}>
        Cozinhar pode ser <span style={{ color: C.laranja }}>simples</span> e cheio de <span style={{ color: C.laranja }}>sabor</span>.
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={COOKING} style={{ width: 230, filter: 'drop-shadow(0 12px 24px rgba(74,44,26,0.12))' }} />
      </div>
      <div style={{ textAlign: 'center', fontSize: 14, color: C.marromSoft, lineHeight: 1.5, padding: '0 8px', marginTop: 8 }}>
        Encontre receitas práticas, organize seus ingredientes e transforme cada refeição em um momento especial.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 22, marginBottom: 20 }}>
        <span style={{ width: 24, height: 6, borderRadius: 99, background: C.laranja }} />
        <span style={{ width: 6, height: 6, borderRadius: 99, background: C.bege }} />
        <span style={{ width: 6, height: 6, borderRadius: 99, background: C.bege }} />
      </div>
      <Button kind="primary" full iconRight="arrowright" onClick={() => go('home')}>Vamos começar!</Button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 3a. HOME FEED — ATUAL (prod-aligned)
//     Only header + search + a grid of recipe cards. No categories,
//     no AI suggestion, no compact list.
function ScreenHomeAtual({ go, navTab, setNavTab }) {
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      <GreetingBar big />
      <ScrollBody pad={16}>
        <div style={{ marginBottom: 22 }}>
          <SearchBar big />
        </div>
        <SectionHeader title="Suas receitas" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <RecipeCard title="Soufflé Nuvem" time="20 min" rating="4,8" ratings="120" placeholder={recipePlaceholder({emoji:'🥞', tint:'yellow'})} tags={[{ label: 'Rápida' }]} onClick={() => go('recipe')} />
          <RecipeCard title="Sushi de Preguiçoso na Travessa" time="90 min" rating="4,7" placeholder={recipePlaceholder({emoji:'🍣', tint:'sage'})} tags={[{ label: 'Salgado', kind: 'green' }]} />
          <RecipeCard title="Big Mac Fit" time="30 min" rating="4,6" fav placeholder={recipePlaceholder({emoji:'🍔', tint:'orange'})} tags={[{ label: 'Fit', kind: 'green' }]} />
          <RecipeCard title="Frango Desfiado Cremoso" time="40 min" rating="4,8" placeholder={recipePlaceholder({emoji:'🍗', tint:'beige'})} tags={[{ label: 'Conforto', kind: 'brown' }]} />
          <RecipeCard title="Macarrão ao pesto" time="25 min" rating="4,8" ratings="120" placeholder={recipePlaceholder({emoji:'🍝', tint:'green'})} tags={[{ label: 'Vegetariana', kind: 'green' }]} />
          <RecipeCard title="Sopa cremosa de abóbora" time="30 min" rating="4,7" placeholder={recipePlaceholder({emoji:'🍛', tint:'orange'})} tags={[{ label: 'Conforto', kind: 'brown' }]} />
        </div>
      </ScrollBody>
      <BottomNav active={navTab} onChange={setNavTab} />
    </div>
  );
}

// 3b. HOME FEED — FUTURA (DS-rich, with AI card + categories + lists)
function ScreenHome({ go, navTab, setNavTab }) {
  const [cat, setCat] = React.useState('todas');
  const cats = [
    { id: 'todas', label: 'Todas', icon: 'grid' },
    { id: 'rapidas', label: 'Rápidas', icon: 'zap' },
    { id: 'saudaveis', label: 'Saudáveis', icon: 'leaf' },
    { id: 'doces', label: 'Doces', icon: 'heart' },
    { id: 'veganas', label: 'Veganas', icon: 'leaf' },
  ];
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      <GreetingBar big />
      <ScrollBody pad={16}>
        <div style={{ marginBottom: 16 }}>
          <SearchBar big />
        </div>

        {/* AI suggestion */}
        <div style={{ background: C.bege, borderRadius: 18, padding: 14, display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, boxShadow: '0 2px 6px rgba(74,44,26,0.06)' }}>
          <img src={COOKING} style={{ height: 56, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.marromSoft }}>Sugestão do Chefitu</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.marrom, lineHeight: 1.15, marginTop: 2 }}>Use o que você tem em casa</div>
            <div style={{ fontSize: 11, color: C.marromSoft, marginTop: 2 }}>Posso sugerir um molho fresquinho com tomate e manjericão.</div>
          </div>
          <Icon name="chevright" size={18} stroke={2.4} />
        </div>

        {/* Sugestões */}
        <SectionHeader title="Sugestões para você" action="Ver todas" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <RecipeCard title="Macarrão ao pesto" time="25 min" rating="4,8" ratings="120" fav placeholder={recipePlaceholder({emoji:'🍝', tint:'green'})} tags={[{ label: 'Rápida' }]} onClick={() => go('recipe')} />
          <RecipeCard title="Frango com legumes" time="35 min" rating="4,7" ratings="80" placeholder={recipePlaceholder({emoji:'🍗', tint:'beige'})} tags={[{ label: 'Saudável', kind: 'green' }]} />
        </div>

        {/* Categorias */}
        <SectionHeader title="Categorias" />
        <CategoryChips items={cats} active={cat} onChange={setCat} />

        {/* Inspirado em você */}
        <SectionHeader title="Inspirado em você" />
        <CompactRecipeCard title="Panqueca de banana e aveia" time="20 min" rating="4,6" placeholder={recipePlaceholder({emoji:'🥞', tint:'yellow'})} tag={{ label: 'Doce' }} />
        <div style={{ height: 8 }} />
        <CompactRecipeCard title="Sopa cremosa de abóbora" time="30 min" rating="4,8" fav placeholder={recipePlaceholder({emoji:'🍛', tint:'orange'})} tag={{ label: 'Conforto', kind: 'brown' }} />
      </ScrollBody>
      <BottomNav active={navTab} onChange={setNavTab} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 4. RECIPE DETAIL
// ──────────────────────────────────────────────────────────────
function ScreenRecipe({ go }) {
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      {/* Full bleed photo header */}
      <div style={{ position: 'relative', width: '100%', height: 320, background: 'linear-gradient(135deg, #C5E4A1, #7DBA4D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 120, filter: 'drop-shadow(0 4px 12px rgba(74,44,26,0.20))' }}>🍝</span>
        <div style={{ position: 'absolute', top: 56, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => go('home')} style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer' }}>
            <Icon name="chevleft" size={20} stroke={2.4} />
          </button>
          <button style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={C.coracao}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: C.creme, marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '22px 20px 110px', overflow: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, color: C.marrom, lineHeight: 1.1 }}>Macarrão ao pesto</div>
        <div style={{ fontSize: 14, color: C.marromSoft, marginTop: 4 }}>Simples, fresco e cheio de sabor.</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Stat icon="clock" label="Tempo" value="25 min" />
          <Stat icon="flame" label="Dificuldade" value="Fácil" />
          <Stat icon="star" label="Avaliação" value="4,8 (120)" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Tag label="Vegetariana" kind="green" />
          <Tag label="Rápida" />
          <Tag label="Fresca" kind="brown" />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: C.marrom, margin: 0 }}>Ingredientes</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.marromSoft }}>4 porções</span>
        </div>

        <Ing emoji="🍝" name="Macarrão" qty="250g" />
        <Ing emoji="🌿" name="Manjericão fresco" qty="1 xícara" check />
        <Ing emoji="🫒" name="Azeite de oliva" qty="1/2 xícara" check />
        <Ing emoji="🥜" name="Castanhas ou nozes" qty="1/4 xícara" check />
        <Ing emoji="🧀" name="Queijo parmesão" qty="1/2 xícara" check />
        <Ing emoji="🧄" name="Dentes de alho" qty="2 un" check />
        <Ing emoji="🧂" name="Sal a gosto" qty="" />

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 18, color: C.marrom, margin: 0 }}>Modo de preparo</h2>
        </div>
        <Step n="1" text="Em uma panela, ferva água com uma pitada de sal. Cozinhe o macarrão por 8–10 minutos até al dente." />
        <Step n="2" text="No processador, bata manjericão, alho, castanhas, queijo e azeite até formar um pesto homogêneo." />
        <Step n="3" text="Escorra o macarrão, misture o pesto ainda quente e finalize com queijo ralado." active />
      </div>

      {/* Floating CTA */}
      <div style={{
        position: 'absolute', bottom: 22, left: 16, right: 16, zIndex: 30,
      }}>
        <button onClick={() => go('home')} style={{
          width: '100%', height: 56, borderRadius: 999, background: C.laranja, color: 'white', border: 'none',
          fontFamily: FONT_UI, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, boxShadow: '0 10px 24px rgba(255,138,43,0.42)', cursor: 'pointer',
        }}>
          Começar receita
          <img src={MASCOT} style={{ height: 26 }} />
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ flex: 1, background: 'white', borderRadius: 14, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 6px rgba(74,44,26,0.06)' }}>
      <Icon name={icon} size={18} color={C.laranja} stroke={2.2} />
      <div style={{ fontSize: 10, color: C.marromSoft, fontWeight: 700, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.marrom, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
function Ing({ emoji, name, qty, check }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.marromFaint}` }}>
      <span style={{ width: 32, height: 32, borderRadius: 10, background: C.bege, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{emoji}</span>
      <span style={{ flex: 1, fontWeight: 600, color: C.marrom, fontSize: 14 }}>{name}</span>
      {qty && <span style={{ fontSize: 12, color: C.marromSoft, fontWeight: 600 }}>{qty}</span>}
      <span style={{ width: 22, height: 22, borderRadius: 999, background: check ? C.verdeFolha : 'transparent', border: check ? 'none' : `2px solid ${C.marromFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {check && <Icon name="check" size={14} color="white" stroke={3.2} />}
      </span>
    </div>
  );
}
function Step({ n, text, active }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, padding: 12, background: active ? C.laranjaSoft : 'white', borderRadius: 16, boxShadow: '0 2px 6px rgba(74,44,26,0.06)' }}>
      <span style={{ width: 28, height: 28, borderRadius: 999, background: active ? C.laranja : C.bege, color: active ? 'white' : C.marrom, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: 13, color: C.marrom, lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 5. PANTRY (Minha despensa)
// ──────────────────────────────────────────────────────────────
function ScreenPantry({ go, navTab, setNavTab }) {
  const [cat, setCat] = React.useState('todos');
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      <TitleBar title="Minha despensa" onBack={() => go('home')} right={<Icon name="more" size={20} stroke={2.4} />} />
      <ScrollBody pad={16}>
        {/* Scan CTA card */}
        <div style={{ background: C.salvia, borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, boxShadow: '0 2px 8px rgba(74,44,26,0.06)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: C.marrom, lineHeight: 1.2 }}>Escanear ingredientes com a câmera</div>
            <div style={{ fontSize: 12, color: C.marromSoft, marginTop: 4, lineHeight: 1.4 }}>Tire uma foto da sua despensa para reconhecer os ingredientes que você tem.</div>
          </div>
          <button style={{ width: 52, height: 52, borderRadius: 999, background: C.marrom, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(74,44,26,0.25)', cursor: 'pointer' }}>
            <Icon name="camera" size={22} color="white" stroke={2.2} />
          </button>
        </div>

        <CategoryChips items={[
          { id: 'todos', label: 'Todos', icon: 'grid' },
          { id: 'frescos', label: 'Frescos', icon: 'leaf' },
          { id: 'secos', label: 'Secos', icon: 'shoppingbag' },
          { id: 'laticinios', label: 'Laticínios', icon: 'pot' },
        ]} active={cat} onChange={setCat} />

        <div style={{ background: 'white', borderRadius: 18, marginTop: 16, padding: '8px 14px', boxShadow: '0 2px 8px rgba(74,44,26,0.06)' }}>
          <PantryRow emoji="🍅" name="Tomate" qty="3 unidades" />
          <PantryRow emoji="🥑" name="Abacate" qty="2 unidades" badge="Use logo" />
          <PantryRow emoji="🥚" name="Ovos" qty="6 unidades" />
          <PantryRow emoji="🌾" name="Arroz integral" qty="1 kg" />
          <PantryRow emoji="🫘" name="Feijão preto" qty="500g" low />
          <PantryRow emoji="🧀" name="Queijo parmesão" qty="150g" last />
        </div>

        <button style={{
          width: '100%', height: 50, borderRadius: 999, background: C.laranja, color: 'white', border: 'none',
          fontFamily: FONT_UI, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, boxShadow: '0 6px 16px rgba(255,138,43,0.32)', marginTop: 18, cursor: 'pointer',
        }}>
          <Icon name="plus" size={18} color="white" stroke={2.6} /> Adicionar ingrediente
        </button>
      </ScrollBody>
      <BottomNav active={navTab} onChange={setNavTab} />
    </div>
  );
}
function PantryRow({ emoji, name, qty, badge, low, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${C.marromFaint}` }}>
      <span style={{ width: 38, height: 38, borderRadius: 12, background: C.bege, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: C.marrom, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 11, color: C.marromSoft }}>{qty}{low && ' · acabando'}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 800, color: '#A56A1D', background: '#FFE9C7', padding: '4px 9px', borderRadius: 999 }}>{badge}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 28, height: 28, borderRadius: 999, background: C.bege, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="minus" size={14} stroke={2.6} />
        </button>
        <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 800, color: C.marrom, fontSize: 13 }}>{(qty.match(/\d+/) || ['1'])[0]}</span>
        <button style={{ width: 28, height: 28, borderRadius: 999, background: C.laranja, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="plus" size={14} color="white" stroke={2.6} />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 6. SHOPPING LIST
// ──────────────────────────────────────────────────────────────
function ScreenList({ go, navTab, setNavTab }) {
  const [checked, setChecked] = React.useState(['macarrao', 'azeite', 'alho']);
  const toggle = (id) => setChecked(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const items = [
    { id: 'manjericao', emoji: '🌿', name: 'Manjericão fresco' },
    { id: 'limao', emoji: '🍋', name: 'Limão' },
    { id: 'frango', emoji: '🍗', name: 'Peito de frango' },
    { id: 'batata', emoji: '🥔', name: 'Batata' },
    { id: 'cebola', emoji: '🧅', name: 'Cebola' },
    { id: 'leite', emoji: '🥛', name: 'Leite' },
    { id: 'iogurte', emoji: '🥣', name: 'Iogurte natural' },
    { id: 'macarrao', emoji: '🍝', name: 'Macarrão' },
    { id: 'azeite', emoji: '🫒', name: 'Azeite de oliva' },
    { id: 'alho', emoji: '🧄', name: 'Alho' },
  ];
  const pending = items.filter(i => !checked.includes(i.id));
  const done = items.filter(i => checked.includes(i.id));

  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      <TitleBar title="Lista de compras" onBack={() => go('home')} right={<Icon name="more" size={20} stroke={2.4} />} />
      <ScrollBody pad={16}>
        <div style={{ background: 'white', borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 8px rgba(74,44,26,0.06)' }}>
          <SectionHeader title="Pendentes" action={`${pending.length}`} />
          {pending.map(i => (
            <div key={i.id} onClick={() => toggle(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.marromFaint}`, cursor: 'pointer' }}>
              <span style={{ width: 22, height: 22, borderRadius: 8, border: `2px solid ${C.marrom}` }} />
              <span style={{ fontSize: 18 }}>{i.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600, color: C.marrom, fontSize: 14 }}>{i.name}</span>
            </div>
          ))}
          {done.length > 0 && <>
            <div style={{ marginTop: 14 }}><SectionHeader title="Comprados" action={`${done.length}`} /></div>
            {done.map(i => (
              <div key={i.id} onClick={() => toggle(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: 'pointer' }}>
                <span style={{ width: 22, height: 22, borderRadius: 8, background: C.verdeFolha, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={14} color="white" stroke={3.2} />
                </span>
                <span style={{ fontSize: 18, opacity: 0.6 }}>{i.emoji}</span>
                <span style={{ flex: 1, fontWeight: 600, color: C.marromSoft, fontSize: 14, textDecoration: 'line-through' }}>{i.name}</span>
              </div>
            ))}
          </>}
        </div>
        <button style={{
          width: '100%', height: 50, borderRadius: 999, background: C.laranja, color: 'white', border: 'none',
          fontFamily: FONT_UI, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, boxShadow: '0 6px 16px rgba(255,138,43,0.32)', marginTop: 18, cursor: 'pointer',
        }}>
          <Icon name="plus" size={18} color="white" stroke={2.6} /> Adicionar item
        </button>
      </ScrollBody>
      <BottomNav active={navTab} onChange={setNavTab} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 7. SAVED (Favoritos)
// ──────────────────────────────────────────────────────────────
function ScreenSaved({ go, navTab, setNavTab }) {
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      <TitleBar title="Favoritos" onBack={() => go('home')} right={<Icon name="more" size={20} stroke={2.4} />} />
      <ScrollBody pad={16}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {['Todas', 'Rápidas', 'Saudáveis', 'Doces', 'Família'].map((t, i) => (
            <span key={t} style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: i === 0 ? C.marrom : 'white', color: i === 0 ? C.creme : C.marrom,
              boxShadow: '0 2px 6px rgba(74,44,26,0.06)', flexShrink: 0,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <RecipeCard title="Macarrão ao pesto" time="25 min" rating="4,8" fav placeholder={recipePlaceholder({emoji:'🍝', tint:'green'})} tags={[{ label: 'Rápida' }]} onClick={() => go('recipe')} />
          <RecipeCard title="Frango com legumes" time="35 min" rating="4,7" fav placeholder={recipePlaceholder({emoji:'🍗', tint:'beige'})} tags={[{ label: 'Saudável', kind: 'green' }]} />
          <RecipeCard title="Panqueca de banana" time="20 min" rating="4,6" fav placeholder={recipePlaceholder({emoji:'🥞', tint:'yellow'})} tags={[{ label: 'Doce' }]} />
          <RecipeCard title="Sopa de abóbora" time="30 min" rating="4,8" fav placeholder={recipePlaceholder({emoji:'🍛', tint:'orange'})} tags={[{ label: 'Conforto', kind: 'brown' }]} />
        </div>
      </ScrollBody>
      <BottomNav active={navTab} onChange={setNavTab} />
    </div>
  );
}

// 8. CHEFITU CHAT
function ScreenChefituChat({ go, navTab, setNavTab }) {
  const suggestions = [
    { icon: 'sparkles', label: 'Sugira algo com o que tenho' },
    { icon: 'camera',   label: 'Tirar foto da despensa' },
    { icon: 'zap',      label: 'Algo rápido pro almoço' },
    { icon: 'heart',    label: 'Sobremesa fofa em 20 min' },
  ];
  return (
    <div style={{ flex: 1, background: C.creme, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: `${SAFE_TOP}px 16px 12px`, gap: 12 }}>
        <button onClick={() => go('home-atual')} style={{ width: 40, height: 40, borderRadius: 999, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(74,44,26,0.06)', cursor: 'pointer' }}>
          <Icon name="chevleft" size={20} stroke={2.4} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(180deg, #FF9F4D 0%, #FF7C12 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(255,138,43,0.30)' }}>
            <img src={MASCOT} style={{ height: 34 }} />
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, color: C.marrom, lineHeight: 1 }}>Chefitu</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: C.verdeFolha }} />
              <span style={{ fontSize: 11, color: C.marromSoft, fontWeight: 600 }}>sempre pronto pra ajudar</span>
            </div>
          </div>
        </div>
        <button style={{ width: 40, height: 40, borderRadius: 999, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="more" size={20} stroke={2.4} />
        </button>
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 16px', scrollbarWidth: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <ChatBubble from="bot">
          Oi! Sou o Chefitu 👋 Posso sugerir receitas com o que você tem em casa, adaptar pratos ao seu gosto, ou montar uma lista de compras. O que vamos cozinhar?
        </ChatBubble>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 48 }}>
          {suggestions.map(s => (
            <button key={s.label} style={{
              background: 'white', border: `1.5px solid ${C.bege}`, borderRadius: 16,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: FONT_UI, fontWeight: 600, fontSize: 13, color: C.marrom, cursor: 'pointer',
              textAlign: 'left', boxShadow: '0 2px 6px rgba(74,44,26,0.04)',
            }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: C.laranjaSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={15} color={C.laranja} stroke={2.2} />
              </span>
              {s.label}
            </button>
          ))}
        </div>

        <ChatBubble from="user">Tenho tomate, alho e manjericão. O que você sugere?</ChatBubble>

        <ChatBubble from="bot">
          Que combo lindo ✨ Pode rolar um <strong>macarrão ao pesto</strong> ou uma <strong>bruschetta italiana</strong>. Olha uma opção rápida:
        </ChatBubble>
        <div style={{ paddingLeft: 48, marginTop: -6 }}>
          <div onClick={() => go('recipe')} style={{
            display: 'flex', gap: 12, background: 'white', borderRadius: 18, padding: 12,
            boxShadow: '0 2px 8px rgba(74,44,26,0.08)', cursor: 'pointer',
            border: `1.5px solid ${C.bege}`,
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, background: 'linear-gradient(135deg, #C5E4A1, #7DBA4D)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🍝</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: C.marrom, lineHeight: 1.15 }}>Macarrão ao pesto</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: C.marromSoft, fontWeight: 600, marginTop: 4 }}>
                <span>★ 4,8</span><span>25 min</span><span>4 porções</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <Tag label="Rápida" />
                <Tag label="Vegetariana" kind="green" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ padding: '8px 12px 96px', background: C.creme }}>
        <div style={{
          background: 'white', borderRadius: 22, padding: '8px 8px 8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 6px 16px rgba(74,44,26,0.10), 0 1px 4px rgba(74,44,26,0.04)',
        }}>
          <button style={{ width: 34, height: 34, borderRadius: 999, background: C.bege, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="camera" size={16} stroke={2.2} />
          </button>
          <span style={{ flex: 1, fontSize: 14, color: C.marromSoft, fontFamily: FONT_UI }}>Pergunte ao Chefitu…</span>
          <button style={{ width: 40, height: 40, borderRadius: 999, background: C.laranja, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255,138,43,0.32)' }}>
            <Icon name="arrowright" size={18} color="white" stroke={2.6} />
          </button>
        </div>
      </div>
      <BottomNav active="chefitu" onChange={setNavTab} />
    </div>
  );
}

function ChatBubble({ from, children }) {
  if (from === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '78%', background: C.laranja, color: 'white', borderRadius: '18px 18px 6px 18px',
          padding: '10px 14px', fontSize: 14, lineHeight: 1.4, fontFamily: FONT_UI,
          boxShadow: '0 2px 6px rgba(255,138,43,0.24)',
        }}>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ width: 36, height: 36, borderRadius: 999, background: 'linear-gradient(180deg, #FF9F4D 0%, #FF7C12 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <img src={MASCOT} style={{ height: 28 }} />
      </div>
      <div style={{
        maxWidth: '78%', background: 'white', color: C.marrom, borderRadius: '18px 18px 18px 6px',
        padding: '10px 14px', fontSize: 14, lineHeight: 1.45, fontFamily: FONT_UI,
        boxShadow: '0 2px 6px rgba(74,44,26,0.06)',
      }}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  ScreenSplash, ScreenOnboarding, ScreenHomeAtual, ScreenHome, ScreenRecipe, ScreenPantry, ScreenList, ScreenSaved, ScreenChefituChat,
});
