const { useState, useEffect, useRef, useCallback } = React;
const { motion, AnimatePresence, animate: fmAnimate } = window.Motion || window.FramerMotion || {};

// Sample data ---------------------------------------------------------------

const OPTIONS = [
  { id: 'autofill-3', label: 'Autofill 3 partidas', weight: 0.22, tone: 'pain',
    description: 'Tres partidas seguidas con el rol que te dé el matchmaking.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Teemo_0.jpg' },
  { id: 'rol-sup-2', label: 'Jugar SUPPORT 2 partidas', weight: 0.18, tone: 'pain',
    description: 'Dos partidas obligatorias en la línea de soporte.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Soraka_0.jpg' },
  { id: 'letra-k', label: 'Champ que empiece por K', weight: 0.15,
    description: 'Tu próxima partida con un champ que empiece por K.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Kayn_0.jpg' },
  { id: 'champ-yuumi', label: 'Jugar Yuumi 1 partida', weight: 0.10, tone: 'pain',
    description: 'Una partida con Yuumi, sí o sí.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yuumi_0.jpg' },
  { id: 'safe', label: 'No pasa nada', weight: 0.20, tone: 'mercy',
    description: 'La ruleta se apiada de ti. Sigue con tu vida.', imageUrl: null },
  { id: 'first-pick-random', label: 'Primer pick = random', weight: 0.15,
    description: 'Tu siguiente partida bloqueas el primer champ random.',
    imageUrl: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Jinx_0.jpg' },
];

const TRIGGER_NICK = 'Werlyb';
const TARGET_NICK = 'JavierrLol';

const PENDING = [
  { id: 'p1', nick: 'Pelukass', label: 'Autofill', remaining: 2,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Lucian_0.jpg' },
  { id: 'p2', nick: 'Knekro', label: 'Champ por K', remaining: 1,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Kindred_0.jpg' },
  { id: 'p3', nick: 'Skain', label: 'Yuumi', remaining: 1,
    img: 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yuumi_0.jpg' },
];

// Geometry — overlay card is 440px wide, 10px horizontal padding
const CARD_W = 64, GAP = 6;
const STEP = CARD_W + GAP;
const STRIP_W = 440 - 10 * 2;
const CENTER_X = STRIP_W / 2;
const CARD_HALF = CARD_W / 2;

function buildStrip(options, repeats = 8) {
  const weighted = [];
  options.forEach(o => {
    const copies = Math.max(2, Math.round(o.weight * 24));
    for (let i = 0; i < copies; i++) weighted.push(o);
  });
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const out = [];
  for (let r = 0; r < repeats; r++) {
    const sh = shuffled(weighted);
    for (const o of sh) out.push(o);
  }
  return out.map((o, i) => ({ ...o, _key: o.id + '-' + i }));
}

function Card({ opt }) {
  const cls = ['card', !opt.imageUrl ? 'no-splash' : ''].filter(Boolean).join(' ');
  const pct = Math.round(opt.weight * 100);
  return (
    <div className={cls}>
      {opt.tone && <span className={'tone-dot ' + opt.tone} />}
      <div className="pct-badge">{pct}%</div>
      {opt.imageUrl ? (
        <div className="mini-avatar">
          <img
            src={opt.imageUrl}
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = 'none';
              el.parentElement.style.background =
                'radial-gradient(circle at 50% 40%, rgba(120,90,40,.5), #1a1410 70%)';
            }}
          />
        </div>
      ) : (
        <div className="mini-avatar mercy">✓</div>
      )}
      <div className="card-label">{opt.label}</div>
    </div>
  );
}

function Carousel({ strip, stripX }) {
  return (
    <div className="carousel-wrap">
      <div className="strip-mask">
        <div className="strip" style={{ transform: `translateX(${stripX}px)` }}>
          {strip.map(o => <Card key={o._key} opt={o} />)}
        </div>
      </div>
      <div className="fade left" />
      <div className="fade right" />
      <div className="pointer">
        <div className="top-line" />
        <div className="arrow-down" />
        <div className="arrow-up" />
        <div className="bot-line" />
      </div>
    </div>
  );
}

function championNameFromUrl(url) {
  if (!url) return 'Mercy';
  const m = url.match(/\/([A-Za-z]+)_0\.jpg$/);
  return m ? m[1] : 'Champ';
}

function ResultRow({ option }) {
  if (!option) return null;
  const champName = championNameFromUrl(option.imageUrl);
  return (
    <motion.div
      className="result-row"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {option.imageUrl && (
        <div className="right-splash" style={{ backgroundImage: `url(${option.imageUrl})` }} />
      )}
      <div className="avatar-wrap">
        <motion.div
          className="name-bubble"
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 380, damping: 14 }}
        >
          {champName}
        </motion.div>
        {option.imageUrl ? (
          <div className="avatar" style={{ backgroundImage: `url(${option.imageUrl})` }} />
        ) : (
          <div className="avatar no-splash">✓</div>
        )}
      </div>
      <div className="res-info">
        <div className="kicker">Castigo Asignado</div>
        <div className="ttl">{option.label}</div>
        <div className="desc">{option.description}</div>
      </div>
      <div className="vsep" />
      <div className="res-block">
        <div className="lbl">Para</div>
        <div className="val">{TARGET_NICK}</div>
      </div>
      <div className="vsep" />
      <div className="res-block">
        <div className="lbl">De parte de</div>
        <div className="val gold">{TRIGGER_NICK}</div>
      </div>
    </motion.div>
  );
}

function Pending({ activeChallenges, onComplete }) {
  const total = activeChallenges.length + PENDING.length;
  return (
    <div className="pending">
      <div className="head">
        <div className="ttl"><span className="seal" />Castigos Pendientes</div>
        <div className="count">{total}</div>
      </div>
      <AnimatePresence initial={false}>
        {activeChallenges.map(c => (
          <motion.div
            key={c.id}
            className="pending-row active"
            initial={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 46, marginBottom: 4 }}
            exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="thumb thumb-active">
              {c.option.imageUrl
                ? <img src={c.option.imageUrl} alt="" />
                : <div className="thumb-mercy">✓</div>}
            </div>
            <div className="active-meta">
              <div className="active-kicker">Castigo Actual</div>
              <div className="active-duel">
                <span className="duel-trigger">{c.trigger}</span>
                <span className="duel-arrow">→</span>
                <span className="duel-target">{c.target}</span>
              </div>
              <div className="active-label">{c.option.label}</div>
            </div>
            <button
              className="btn-complete"
              onClick={() => onComplete(c.id)}
              title="Marcar como completado"
            >
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {PENDING.map(p => (
        <div key={p.id} className="pending-row">
          <div className="thumb"><img src={p.img} alt="" /></div>
          <div>
            <div className="nick">{p.nick}</div>
            <div className="sub">{p.label} · <b>{p.remaining} restantes</b></div>
          </div>
          <div className="icons">
            <span>S</span><span>K</span><span>Y</span><span>R</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   ALERT INTRO — full-screen warning animation (~2s) played before spin.
   Self-contained: in production this whole component can be replaced by a
   <video src="alert.webm" autoplay onEnded={onComplete} /> tag.
   ========================================================================= */
function AlertIntro({ trigger, target, onComplete, duration = 2700 }) {
  useEffect(() => {
    const t = setTimeout(() => { if (onComplete) onComplete(); }, duration);
    return () => clearTimeout(t);
  }, [onComplete, duration]);
  return (
    <div className="alert-intro" data-component="alert-intro">
      <div className="alert-marker">
        <div className="alert-marker-aura" />
        <div className="alert-marker-shock s1" />
        <div className="alert-marker-shock s2" />
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="shellBody" cx="50%" cy="38%" r="62%">
              <stop offset="0%"   stopColor="#FF6B6B" />
              <stop offset="45%"  stopColor="#C0233A" />
              <stop offset="100%" stopColor="#5A0E1C" />
            </radialGradient>
            <linearGradient id="shellRim" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#F6E232" />
              <stop offset="60%"  stopColor="#C9B91D" />
              <stop offset="100%" stopColor="#7A6F0E" />
            </linearGradient>
            <radialGradient id="shellHighlight" cx="40%" cy="28%" r="38%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Spikes (8 around perimeter) — drawn first so they sit behind the dome rim */}
          <g fill="url(#shellRim)" stroke="#1a0a0a" strokeWidth="1.2" strokeLinejoin="round">
            {/* top */}
            <polygon points="60,4 54,22 66,22" />
            {/* top-right */}
            <polygon points="92,16 81,29 92,33" />
            {/* right */}
            <polygon points="112,58 96,52 96,66" />
            {/* bottom-right */}
            <polygon points="98,92 86,82 84,96" />
            {/* bottom */}
            <polygon points="60,116 54,98 66,98" />
            {/* bottom-left */}
            <polygon points="22,92 36,82 38,96" />
            {/* left */}
            <polygon points="8,58 24,52 24,66" />
            {/* top-left */}
            <polygon points="28,16 39,29 28,33" />
          </g>

          {/* Outer rim */}
          <circle cx="60" cy="60" r="44" fill="url(#shellRim)" stroke="#1a0a0a" strokeWidth="2" />

          {/* Inner dome — red gradient body */}
          <circle cx="60" cy="60" r="37" fill="url(#shellBody)" stroke="#3a0a14" strokeWidth="1.2" />

          {/* Hex/spot texture on the dome */}
          <g fill="rgba(0,0,0,0.28)" stroke="rgba(0,0,0,0.45)" strokeWidth="0.6">
            <polygon points="60,38 67,42 67,50 60,54 53,50 53,42" />
            <polygon points="46,52 53,56 53,64 46,68 39,64 39,56" />
            <polygon points="74,52 81,56 81,64 74,68 67,64 67,56" />
            <polygon points="60,66 67,70 67,78 60,82 53,78 53,70" />
          </g>

          {/* Specular highlight */}
          <circle cx="60" cy="60" r="37" fill="url(#shellHighlight)" />

          {/* Inner glow rim */}
          <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(246,226,50,0.5)" strokeWidth="0.8" />
        </svg>
      </div>
      <div className="alert-caption">
        <span className="pulse-dot" />Alerta · Objetivo Marcado
      </div>
      <div className="alert-target-small">
        <span className="nick-trigger">{trigger}</span>
        <span className="arrow">→</span>
        <span>{target}</span>
      </div>
    </div>
  );
}

function App() {
  const [strip, setStrip] = useState(() => buildStrip(OPTIONS));
  const [winnerId, setWinnerId] = useState('rol-sup-2');
  const [stripX, setStripX] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | alert | alert-preview | spinning | result
  const [resultOption, setResultOption] = useState(null);
  const [timer, setTimer] = useState(0);
  const [bgOn, setBgOn] = useState(true);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [alertKey, setAlertKey] = useState(0);
  const [pendingWinnerId, setPendingWinnerId] = useState(null);
  const animRef = useRef(null);
  const spinIdRef = useRef(0);
  const resultTimerRef = useRef(null);

  const targetXFor = (idx) => CENTER_X - idx * STEP - CARD_HALF;
  const pickWinnerIndex = (s, wid) => {
    const min = Math.floor(s.length * 0.7);
    const max = s.length - 4;
    const candidates = [];
    for (let i = min; i <= max; i++) if (s[i].id === wid) candidates.push(i);
    if (candidates.length) return candidates[Math.floor(candidates.length / 2)];
    for (let i = min; i < s.length; i++) if (s[i].id === wid) return i;
    return s.findIndex(x => x.id === wid);
  };

  const stopAnim = () => { if (animRef.current) { try { animRef.current.stop(); } catch(e) {} animRef.current = null; } };
  const clearResultTimer = () => { if (resultTimerRef.current) { clearTimeout(resultTimerRef.current); resultTimerRef.current = null; } };

  const spin = useCallback((winId) => {
    const wid = winId || winnerId;
    clearResultTimer();
    stopAnim();
    setResultOption(null);
    const fresh = buildStrip(OPTIONS);
    setStrip(fresh);
    const idx = pickWinnerIndex(fresh, wid);
    if (idx < 0) return;
    const targetX = targetXFor(idx);
    setStripX(0);
    setPhase('spinning');
    setTimer(4);

    const myId = ++spinIdRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (myId !== spinIdRef.current) return;
        stopAnim();
        animRef.current = fmAnimate(0, targetX, {
          duration: 3.6,
          ease: [0.15, 0.85, 0.25, 1],
          onUpdate: (v) => setStripX(v),
          onComplete: () => {
            if (myId !== spinIdRef.current) return;
            const opt = OPTIONS.find(o => o.id === wid);
            setResultOption(opt);
            setPhase('result');
            // Hold the result banner for ~1s (with its pulse), then fade out.
            // AnimatePresence on the overlay handles the 250ms exit.
            resultTimerRef.current = setTimeout(() => {
              if (myId !== spinIdRef.current) return;
              // Push to active challenges so the mini-reminder takes over.
              setActiveChallenges(prev => [{
                id: 'chal-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                option: opt,
                trigger: TRIGGER_NICK,
                target: TARGET_NICK,
              }, ...prev]);
              setPhase('idle');
              setResultOption(null);
            }, 1000);
          }
        });
      });
    });
  }, [winnerId]);

  const reset = () => {
    spinIdRef.current++;
    clearResultTimer();
    stopAnim();
    setPhase('idle');
    setResultOption(null);
    setStripX(0);
    setActiveChallenges([]);
    setPendingWinnerId(null);
  };

  const completeChallenge = (id) => {
    setActiveChallenges(prev => prev.filter(c => c.id !== id));
  };

  // Entry point used by DISPARAR / hotkey R / dropdown change. Plays the
  // full-screen alert first, then runs spin() when AlertIntro signals done.
  const triggerSpin = useCallback((winId) => {
    const wid = winId || winnerId;
    clearResultTimer();
    stopAnim();
    setResultOption(null);
    setPendingWinnerId(wid);
    setAlertKey(k => k + 1);
    setPhase('alert');
  }, [winnerId]);

  const onAlertComplete = useCallback(() => {
    const wid = pendingWinnerId || winnerId;
    setPendingWinnerId(null);
    spin(wid);
  }, [pendingWinnerId, winnerId, spin]);

  // Replay the alert by itself without re-spinning (preview helper).
  const replayAlert = useCallback(() => {
    if (phase === 'spinning' || phase === 'alert') return;
    clearResultTimer();
    stopAnim();
    setResultOption(null);
    setPendingWinnerId(null);
    setAlertKey(k => k + 1);
    setPhase('alert-preview');
    setTimeout(() => {
      setPhase(prev => prev === 'alert-preview' ? 'idle' : prev);
    }, 2750);
  }, [phase]);

  const toggleBg = () => {
    const newBg = !bgOn;
    setBgOn(newBg);
    if (newBg) {
      document.body.classList.add('preview');
      if (window.__bgCascade) window.__bgCascade.apply();
    } else {
      document.body.classList.remove('preview');
      if (window.__bgCascade) window.__bgCascade.clear();
    }
  };

  // Initial demo run on page load: alert -> spin (~2s + 3.6s + 1s).
  useEffect(() => {
    const t = setTimeout(() => triggerSpin('rol-sup-2'), 600);
    return () => { clearTimeout(t); clearResultTimer(); stopAnim(); };
    // eslint-disable-next-line
  }, []);

  // Timer countdown during spin (4s total to cover the 3.6s spin)
  useEffect(() => {
    if (phase !== 'spinning') return;
    const start = performance.now();
    const total = 4;
    const id = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      setTimer(Math.max(0, total - elapsed));
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  // R key: random spin
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'r' || e.key === 'R') && phase !== 'spinning' && phase !== 'alert') {
        const total = OPTIONS.reduce((a, o) => a + o.weight, 0);
        let r = Math.random() * total;
        let chosen = OPTIONS[0];
        for (const o of OPTIONS) {
          r -= o.weight;
          if (r <= 0) { chosen = o; break; }
        }
        setWinnerId(chosen.id);
        triggerSpin(chosen.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerSpin, phase]);

  const onPickWinner = (e) => setWinnerId(e.target.value);
  const onGirar = () => triggerSpin(winnerId);
  const busy = phase === 'alert' || phase === 'spinning';
  const showOverlay = phase === 'spinning' || phase === 'result';
  const showAlert = phase === 'alert' || phase === 'alert-preview';
  const isObs = typeof document !== 'undefined' && document.body.classList.contains('obs');

  return (
    <>
      <AnimatePresence>
        {showAlert && (
          <AlertIntro
            key={alertKey}
            trigger={TRIGGER_NICK}
            target={TARGET_NICK}
            onComplete={phase === 'alert' ? onAlertComplete : undefined}
          />
        )}
      </AnimatePresence>

      {!isObs && (
        <div className="dev-panel">
          <button className={'b bg-toggle ' + (bgOn ? 'on' : '')} onClick={toggleBg}>
            BG {bgOn ? 'On' : 'Off'}
          </button>
          <button className="b" onClick={replayAlert} disabled={busy}>
            Alerta
          </button>
          <button className="b primary" onClick={onGirar} disabled={busy}>
            Disparar
          </button>
          <button className="b" onClick={reset} disabled={phase === 'idle' && activeChallenges.length === 0}>
            Reset
          </button>
        </div>
      )}

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="overlay-card"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="header-row">
              <div className="helm">S</div>
              <div className="brand-mini">SOLOQ<span className="accent">·</span>CHALLENGE</div>
              <div className="divider" />
              <div className="ruleta-mini">
                <span className="pulse-dot" />Ruleta
              </div>
              <div className="divider" />
              <div className="duel">
                <span className="nick-trigger">{TRIGGER_NICK}</span>
                <span className="arrow">→</span>
                <span className="nick-target">{TARGET_NICK}</span>
              </div>
              <div className="header-spacer" />
              <div className="week-mini">S02<span className="sep">·</span>M#047</div>
              {phase === 'spinning' && (
                <div className="timer-mini">0:{String(Math.ceil(timer)).padStart(2, '0')}</div>
              )}
            </div>

            {phase === 'spinning' && (
              <>
                <Carousel strip={strip} stripX={stripX} />
                <div className="spin-progress">
                  <div className="spin-progress-fill" />
                </div>
              </>
            )}
            {phase === 'result' && resultOption && (
              <ResultRow option={resultOption} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Pending activeChallenges={activeChallenges} onComplete={completeChallenge} />

      {!isObs && (
        <div className="controls">
          <span className="lbl">Forzar Ganador</span>
          <select value={winnerId} onChange={onPickWinner} disabled={busy}>
            {OPTIONS.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button className="btn-girar" onClick={onGirar} disabled={busy}>
            Girar Ruleta
          </button>
          <span className="hint"><b>R</b>random</span>
        </div>
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
