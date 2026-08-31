import { useEffect, useRef, useState } from 'react'

// The signature home-page animation: a briefing that assembles itself on a loop.
// Ported 1:1 from the Claude Design handoff (BriefingBuilder.dc.html). Every visual
// value is derived from a single elapsed-time `t`; there is no per-element state machine.
//
// Two modes via the `stage` prop:
//   'teaser' — hero right column. Types -> plans -> searches, then a hand-off line. Loop 7800ms.
//   'full'   — the "Watch it think" section. Runs the whole sequence incl. the briefing card. Loop 13800ms.

const NAME = 'Priya Nair · Notion'
const ANGLES = ['Their role', 'The company', 'Recent news', 'Common ground', 'What they want', 'Your leverage']
const QUERIES = [
  ['Priya Nair · role at Notion', 2],
  ['Notion · product roadmap 2026', 3],
  ['Notion · press, last 30 days', 2],
  ['Priya Nair · talks and posts', 2],
  ['Notion · hiring signals', 1],
  ['Shared ground · design systems', 1],
]
const CARDS = [
  ['She ships the boring infrastructure', "Priya has led Notion's design systems group since 2024 and talks publicly about platform work that lets product teams move fast.", '2 sources'],
  ['The agent surface changed her scope', "This year's launch reframed the roadmap around workflows, not documents — her team owns the components underneath it.", '3 sources'],
  ['You came up the same way', 'Her first conference talk covers the internal-tools migration you ran last year. Real common ground, not small talk.', '2 sources'],
]
const QS = [
  'What broke first when the design system met the agent surfaces?',
  'Who makes the call when speed and consistency disagree?',
  'What would make my first 90 days obviously worth it to you?',
]

const T = {
  type: 500, typeDur: 1500,
  chip: 2200, chipStep: 170,
  pill: 3150, pillStep: 130,
  src: 4300, srcStep: 280,
  snap: 5900,
  card: 6500, cardStep: 620,
  qhead: 8500, qStep: 260,
  help: 9900,
  stamp: 10700,
}
const FULL_LOOP = 13800
const TEASER_LOOP = 7800

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
const ease = (x) => 1 - Math.pow(1 - x, 3)
const app = (t, s, d) => {
  const e = ease(clamp01((t - s) / (d || 420)))
  return { op: e, ty: ((1 - e) * 9).toFixed(2) + 'px' }
}

function computeVals(t, teaser) {
  const typedN = Math.round(clamp01((t - T.type) / T.typeDur) * NAME.length)
  const typing = t > T.type && t < T.type + T.typeDur + 200

  const chips = ANGLES.map((label, i) => {
    const a = app(t, T.chip + i * T.chipStep, 320)
    const on = a.op > 0.5
    return {
      label, op: a.op, ty: a.ty,
      bc: on ? '#D5CDBE' : '#E9E3D8', bg: on ? '#F6F3EE' : '#FCFAF6',
      fg: on ? '#3B3833' : '#A29B90', dot: on ? '#21395C' : '#DCD5C8',
    }
  })

  let srcCount = 0
  const pills = QUERIES.map(([q, n], i) => {
    const a = app(t, T.pill + i * T.pillStep, 300)
    const sourced = t > T.src + i * T.srcStep
    if (sourced) srcCount += n
    return {
      q, op: a.op, ty: a.ty,
      status: sourced ? '✓ Sourced' : 'Searching…',
      fg: sourced ? '#2E6B4F' : '#A29B90',
      bc: sourced ? 'rgba(46,107,79,.28)' : '#E9E3D8',
      bg: sourced ? 'rgba(46,107,79,.06)' : '#FCFAF6',
      dot: sourced ? '#2E6B4F' : '#C6A24A',
      dotOp: sourced ? 1 : 0.35 + 0.65 * Math.abs(Math.sin(t / 190 + i)),
    }
  })

  const cards = CARDS.map(([title, body, src], i) => {
    const a = app(t, T.card + i * T.cardStep, 480)
    return { title, body, src, op: a.op, ty: a.ty, srcOp: clamp01((t - (T.card + i * T.cardStep + 320)) / 340) }
  })

  const questions = QS.map((text, i) => {
    const a = app(t, T.qhead + 120 + i * T.qStep, 380)
    return { text, n: '0' + (i + 1), op: a.op, ty: a.ty }
  })

  const done = t > T.stamp
  return {
    typed: NAME.slice(0, typedN),
    caret: typing ? (t % 900 < 480 ? 1 : 0.12) : typedN ? 0.12 : 1,
    chips, pills, cards, questions, srcCount,
    clock: (Math.min(t / (teaser ? T.stamp : T.stamp + 300), 1) * 19).toFixed(1) + 's',
    pct: Math.round(clamp01(t / (teaser ? T.pill + 3200 : T.stamp + 300)) * 100),
    liveDot: done ? 1 : 0.35 + 0.65 * Math.abs(Math.sin(t / 420)),
    isTeaser: teaser,
    showBriefing: !teaser,
    teaserOp: clamp01((t - (T.src + 1400)) / 500),
    snap: app(t, T.snap, 520),
    qhead: app(t, T.qhead, 320),
    help: app(t, T.help, 520),
    stamp: app(t, T.stamp, 520),
  }
}

const F_SANS = "'IBM Plex Sans',sans-serif"
const F_SERIF = "'Newsreader',Georgia,serif"

export default function BriefingBuilder({ stage = 'teaser', speed = 1 }) {
  const teaser = stage === 'teaser'
  const rootRef = useRef(null)
  const [t, setT] = useState(0)

  // rAF loop, throttled to ~18fps (reads as a machine working), paused off-screen,
  // dt clamped so a backgrounded tab doesn't jump. Reduced motion -> final state, no loop.
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setT(T.stamp + 900)
      return
    }
    const loopLen = teaser ? TEASER_LOOP : FULL_LOOP
    let raf, prev = 0, last = 0, cur = 0
    let visible = true
    let io
    if (rootRef.current && window.IntersectionObserver) {
      io = new IntersectionObserver((e) => { visible = e[0].isIntersecting }, { threshold: 0.02 })
      io.observe(rootRef.current)
    }
    const spd = Number(speed) || 1
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const now = performance.now()
      const dt = prev ? now - prev : 0
      prev = now
      if (!visible || now - last < 55) return
      last = now
      cur = (cur + Math.min(dt, 120) * spd) % loopLen
      setT(cur)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); if (io) io.disconnect() }
  }, [teaser, speed])

  const v = computeVals(t, teaser)

  return (
    <div
      ref={rootRef}
      style={{
        border: '1px solid #E4DED3', borderRadius: 14, background: '#FCFAF6',
        boxShadow: '0 1px 2px rgba(23,22,26,.05),0 26px 50px -34px rgba(23,22,26,.45)',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid #EDE7DC', background: '#F6F3EE' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2E6B4F', opacity: v.liveDot, flex: 'none' }} />
        <span style={{ font: `500 10px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#8C877E' }}>PrepPilot · live briefing</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <span style={{ font: `500 11px/1 ${F_SANS}`, color: '#2E6B4F' }}>{v.srcCount} sources</span>
          <span style={{ font: `400 11px/1 ${F_SANS}`, color: '#8C877E', fontVariantNumeric: 'tabular-nums' }}>{v.clock}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#EDE7DC' }}>
        <div style={{ height: 2, background: '#2E6B4F', width: v.pct + '%' }} />
      </div>

      <div style={{ padding: 'clamp(14px,3vw,20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* WHO field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #E4DED3', borderRadius: 10, padding: '12px 14px', background: '#FFFDF9' }}>
          <span style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', color: '#A29B90', flex: 'none' }}>WHO</span>
          <span style={{ font: `400 clamp(14px,1.6vw,16px)/1.2 ${F_SANS}`, color: '#17161A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {v.typed}<span style={{ opacity: v.caret, color: '#21395C' }}>|</span>
          </span>
        </div>

        {/* Angle chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90' }}>Planning six angles</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {v.chips.map((c, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 999, border: `1px solid ${c.bc}`, background: c.bg, font: `400 12px/1 ${F_SANS}`, color: c.fg, opacity: c.op, transform: `translateY(${c.ty})` }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot }} />{c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Search pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90' }}>Searching in parallel</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 7 }}>
            {v.pills.map((p, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 999, border: `1px solid ${p.bc}`, background: p.bg, opacity: p.op, transform: `translateY(${p.ty})` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot, flex: 'none', opacity: p.dotOp }} />
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: `400 11.5px/1.2 ${F_SANS}`, color: '#55514B' }}>{p.q}</span>
                <span style={{ font: `500 10.5px/1 ${F_SANS}`, color: p.fg, whiteSpace: 'nowrap' }}>{p.status}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Teaser hand-off line */}
        {v.isTeaser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px dashed #E4DED3', paddingTop: 14, opacity: v.teaserOp }}>
            <span style={{ font: `400 13px/1.4 ${F_SANS}`, color: '#55514B' }}>Assembling your briefing — snapshot, talking points, questions.</span>
            <a href="#demo" style={{ marginLeft: 'auto', font: `500 12px/1 ${F_SANS}`, color: '#21395C', whiteSpace: 'nowrap' }}>Watch it finish ↓</a>
          </div>
        )}

        {/* Briefing card (full only) */}
        {v.showBriefing && (
          <div style={{ borderTop: '1px solid #EDE7DC', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ opacity: v.snap.op, transform: `translateY(${v.snap.ty})` }}>
              <div style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90', marginBottom: 7 }}>Snapshot</div>
              <div style={{ font: `400 clamp(14px,1.5vw,15px)/1.55 ${F_SANS}`, color: '#55514B', textWrap: 'pretty' }}>Priya Nair — Head of Design Systems at Notion, San Francisco. Eight years in platform design. You meet Thursday, 30 minutes, final round.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90' }}>Talking points</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(215px,1fr))', gap: 8 }}>
                {v.cards.map((c, i) => (
                  <div key={i} style={{ border: '1px solid #E4DED3', borderRadius: 10, background: '#FFFDF9', padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 7, opacity: c.op, transform: `translateY(${c.ty})` }}>
                    <div style={{ font: `500 15px/1.3 ${F_SERIF}`, color: '#17161A', textWrap: 'pretty' }}>{c.title}</div>
                    <div style={{ font: `400 12.5px/1.5 ${F_SANS}`, color: '#6B665F', textWrap: 'pretty' }}>{c.body}</div>
                    <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: 'rgba(46,107,79,.09)', border: '1px solid rgba(46,107,79,.22)', font: `500 10px/1.4 ${F_SANS}`, color: '#2E6B4F', opacity: c.srcOp }}>✓ {c.src}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: v.qhead.op }}>
              <div style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90' }}>Questions that land</div>
              {v.questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', opacity: q.op, transform: `translateY(${q.ty})` }}>
                  <span style={{ font: `400 12px/1.5 ${F_SERIF}`, color: '#A29B90', flex: 'none' }}>{q.n}</span>
                  <span style={{ font: `400 clamp(13px,1.5vw,14.5px)/1.5 ${F_SANS}`, color: '#3B3833', textWrap: 'pretty' }}>{q.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, opacity: v.help.op, transform: `translateY(${v.help.ty})` }}>
              <div style={{ border: '1px solid #E4DED3', borderRadius: 10, padding: '12px 13px', background: '#F6F3EE' }}>
                <div style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90', marginBottom: 8 }}>How you help her</div>
                <div style={{ font: `400 12.5px/1.55 ${F_SANS}`, color: '#55514B', textWrap: 'pretty' }}>You ran the exact systems migration her team starts in Q4 — bring the rollout doc.</div>
              </div>
              <div style={{ border: '1px solid #E4DED3', borderRadius: 10, padding: '12px 13px', background: '#F6F3EE' }}>
                <div style={{ font: `500 9px/1 ${F_SANS}`, letterSpacing: '.15em', textTransform: 'uppercase', color: '#A29B90', marginBottom: 8 }}>How she helps you</div>
                <div style={{ font: `400 12.5px/1.55 ${F_SANS}`, color: '#55514B', textWrap: 'pretty' }}>She owns headcount for the systems pod. Ask where the role sits on the Q4 roadmap.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderTop: '1px solid #EDE7DC', paddingTop: 13, opacity: v.stamp.op, transform: `translateY(${v.stamp.ty})` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 17, height: 17, borderRadius: '50%', background: '#2E6B4F', color: '#FCFAF6', font: `500 10px/1 ${F_SANS}`, flex: 'none' }}>✓</span>
              <span style={{ font: `500 12.5px/1.4 ${F_SANS}`, color: '#2E6B4F' }}>Briefing ready in 19s · 11 sources cited</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
