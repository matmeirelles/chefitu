// Chefitu — Board de telas (canvas)
// Mounts all 9 mobile screens as static previews on a Figma-style canvas,
// grouped by status. Click any artboard's expand icon (or label) to open it
// fullscreen with full interactivity.

const NOOP = () => {};

// ─────────────────────────────────────────────────────────────
// StaticScreen — renders one Screen* from screens.jsx, with tab state
// so the bottom-nav stays visually consistent. Interaction is disabled
// in the board via the [data-dc-slot] CSS rule in board.html; in the
// focus overlay (portal'd to body) the rule doesn't match, so the
// screen is fully live there.
// ─────────────────────────────────────────────────────────────
function StaticScreen({ Comp, navTab = 'home' }) {
  const [tab, setTab] = React.useState(navTab);
  return (
    <div className="board-screen-static" style={{ width: '100%', height: '100%' }}>
      <Comp go={NOOP} navTab={tab} setNavTab={setTab} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Note — behavior post-it. Three palettes mapped to section status.
// ─────────────────────────────────────────────────────────────
function Note({ kind = 'note', title, lines }) {
  const palette = {
    note:   { bg: '#FFF6E9', border: 'rgba(74,44,26,0.16)',  tag: '#6B4530', bullet: '#FF8A2B' },
    build:  { bg: '#FFEAD0', border: 'rgba(229,117,26,0.32)', tag: '#A55109', bullet: '#E5751A' },
    future: { bg: '#EFE6F7', border: 'rgba(90,59,127,0.28)',  tag: '#5A3B7F', bullet: '#8A6AC2' },
  }[kind];
  return (
    <div style={{
      width: 248, background: palette.bg, color: '#4A2C1A',
      borderRadius: 18, padding: '16px 18px 18px',
      border: '1.5px solid ' + palette.border,
      boxShadow: '0 1px 2px rgba(74,44,26,0.04), 0 6px 16px rgba(74,44,26,0.06)',
      fontFamily: '"Nunito", system-ui, sans-serif',
    }}>
      <div style={{
        fontFamily: '"Baloo 2", system-ui, sans-serif',
        fontWeight: 800, fontSize: 10.5, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: palette.tag, marginBottom: 10,
      }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {lines.map((l, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.45, color: '#3a2210' }}>
            <span style={{ flexShrink: 0, color: palette.bullet, fontWeight: 800, lineHeight: 1.4 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: l }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Frame — phone fills the artboard; note floats to the right of it via
// absolute positioning + section gap. In focus mode the note is hidden
// (it sits outside the focus card's overflow:hidden, and the .board-note
// CSS rule keys off the [data-dc-slot] ancestor that only exists in the
// board view) so the focus scaler operates on the phone alone.
// ─────────────────────────────────────────────────────────────
function Frame({ Comp, navTab, noteKind, noteTitle, noteLines }) {
  return (
    <React.Fragment>
      <IOSDevice width={402} height={874}>
        <StaticScreen Comp={Comp} navTab={navTab} />
      </IOSDevice>
      <div className="board-note" style={{
        position: 'absolute', top: 18, left: '100%', marginLeft: 22,
      }}>
        <Note kind={noteKind} title={noteTitle} lines={noteLines} />
      </div>
    </React.Fragment>
  );
}

// ─────────────────────────────────────────────────────────────
// Per-screen specs
// ─────────────────────────────────────────────────────────────
const NOW = [
  { id: 'splash', label: '01 · Splash', comp: 'ScreenSplash', tab: 'home',
    note: { title: 'Comportamento', lines: [
      'Apresenta a marca enquanto o app carrega.',
      'Mascote pisca a cada <b>6–9s</b>.',
      '<b>Vamos começar</b> → onboarding (1ª vez) ou Home.',
    ]}},
  { id: 'onboarding', label: '02 · Onboarding', comp: 'ScreenOnboarding', tab: 'home',
    note: { title: 'Comportamento', lines: [
      '<b>3 telas</b> em sequência — dots indicam progresso.',
      '<b>Pular</b> sempre disponível no canto superior.',
      'Última tela termina em <i>"Vamos começar!"</i> → Home.',
    ]}},
  { id: 'home-atual', label: '03 · Home', comp: 'ScreenHomeAtual', tab: 'home',
    note: { title: 'Comportamento', lines: [
      'Saudação personalizada + busca + grid 2-col.',
      'Tap no card → tela de receita.',
      '<b>♥</b> favorita inline; bottom nav fixo nas 5 abas.',
    ]}},
  { id: 'receita', label: '04 · Receita', comp: 'ScreenRecipe', tab: 'home',
    note: { title: 'Comportamento', lines: [
      'Foto full-bleed; conteúdo cobre a foto ao rolar.',
      'Ingredientes com <b>checkbox individual</b>.',
      '<b>←</b> volta · <b>♥</b> favorita.',
      'CTA <b>Começar receita</b> abre o passo a passo.',
    ]}},
  { id: 'despensa', label: '05 · Despensa', comp: 'ScreenPantry', tab: 'list',
    note: { title: 'Comportamento', lines: [
      'CTA principal: <b>foto da despensa</b> p/ reconhecer ingredientes.',
      'Chips filtram por categoria.',
      'Contador <b>+ / −</b> ajusta quantidade.',
      'Badge <b>Use logo</b> sinaliza vencimento próximo.',
    ]}},
  { id: 'lista', label: '06 · Lista de compras', comp: 'ScreenList', tab: 'list',
    note: { title: 'Comportamento', lines: [
      'Tap risca o item e move pra <b>Comprados</b>.',
      'Itens entram <b>automaticamente</b> a partir das receitas.',
      'Adicionar manual via CTA inferior.',
    ]}},
  { id: 'favoritos', label: '07 · Favoritos', comp: 'ScreenSaved', tab: 'favs',
    note: { title: 'Comportamento', lines: [
      'Chips no topo filtram por tag.',
      'Mesmo card da Home, todos já com <b>♥</b>.',
      'Long-press abre ações: remover, mover de tag.',
    ]}},
];

const BUILDING = [
  { id: 'chefitu-chat', label: '08 · Chat com Chefitu', comp: 'ScreenChefituChat', tab: 'chefitu',
    note: { title: 'Em construção', lines: [
      'Chat com o mascote como <b>persona</b>.',
      '<b>4 sugestões</b> iniciais reduzem cold start.',
      'Receitas aparecem <b>inline como card</b> clicável.',
      'Composer aceita texto + foto da despensa.',
    ]}},
];

const FUTURE = [
  { id: 'home-futura', label: '09 · Home (futura)', comp: 'ScreenHome', tab: 'home',
    note: { title: 'Ideia futura', lines: [
      'Card <b>Sugestão do Chefitu</b> no topo do feed.',
      'Chips de categoria abaixo da busca.',
      'Seções: <b>Sugestões</b>, <b>Categorias</b>, <b>Inspirado em você</b>.',
      'Variação de cards: 2-col + compactos horizontais.',
    ]}},
];

// ─────────────────────────────────────────────────────────────
// Board
// ─────────────────────────────────────────────────────────────
function Board() {
  // Artboard sized to the phone alone so focus-mode scaling targets the
  // phone (not phone + note). Note floats outside via overflow:visible +
  // a wider section gap.
  const W = 402, H = 874;
  const make = (s, kind) => (
    <DCArtboard key={s.id} id={s.id} label={s.label} width={W} height={H}
      style={{ background: 'transparent', boxShadow: 'none', overflow: 'visible', borderRadius: 0 }}>
      <Frame
        Comp={window[s.comp]}
        navTab={s.tab}
        noteKind={kind}
        noteTitle={s.note.title}
        noteLines={s.note.lines}
      />
    </DCArtboard>
  );

  const NOTE_LANE = 308; // 248 note + 22 left margin + 38 inter-card buffer

  return (
    <DesignCanvas minScale={0.12} maxScale={2}>
      <DCSection id="now" gap={NOTE_LANE}
        title="No app hoje"
        subtitle="Telas presentes na versão atual em produção. Comportamento estável.">
        {NOW.map((s) => make(s, 'note'))}
      </DCSection>

      <DCSection id="building" gap={NOTE_LANE}
        title="Em construção"
        subtitle="Telas em desenvolvimento — design aprovado, ainda não estão no app.">
        {BUILDING.map((s) => make(s, 'build'))}
      </DCSection>

      <DCSection id="future" gap={NOTE_LANE}
        title="Ideias futuras"
        subtitle="Explorações e variações para discussão — não comprometidas com roadmap.">
        {FUTURE.map((s) => make(s, 'future'))}
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Board />);
