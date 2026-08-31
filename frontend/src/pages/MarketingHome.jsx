import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BriefingBuilder from '../components/BriefingBuilder'

// Public marketing front door for PrepPilot. Ported 1:1 from the Claude Design
// handoff (PrepPilot Home.dc.html) — final colors, type, spacing, copy, motion.
// Standalone: it renders its own banner/header/footer (NOT inside the app Layout).
// Conversion CTAs route to /login; the rest are in-page scroll anchors.

const F_SANS = "'IBM Plex Sans',sans-serif"
const F_SERIF = "'Newsreader',Georgia,serif"

function PlaneMark({ size = 26, stroke = '#21395C' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.5 2.5 L10.6 13.4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21.5 2.5 L14.6 21.5 L10.6 13.4 L2.5 9.4 Z" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const COMPARE_LEFT = [
  'Searches whatever comes to mind first',
  'One query at a time, then another',
  'Blends what it found with what it assumed',
  'Returns a wall of text to read on the way in',
  "Doesn't know who you are or what you want",
]
const COMPARE_RIGHT = [
  'Plans six angles before it searches anything',
  'Fires those searches in parallel, live',
  'Every claim carries the source it came from',
  'Hands you a plan, not a transcript',
  'Built around you, your goal, and this meeting',
]
const FEATURES = [
  ['01', 'The snapshot', 'Who they are, what they own, where they’ve been — the thirty seconds you’d want before the door opens.', false],
  ['02', 'Talking points, sourced', 'Three things worth raising, each carrying the citations it came from. Open the source if you want to read it yourself.', true],
  ['03', 'Questions that land', 'Specific enough that they can tell you actually looked — and open enough that they want to answer.', false],
  ['04', 'How you help each other', 'Two columns: what you can offer them, and what they’re positioned to unlock for you.', false],
]
const USE_CASES = [
  ['Final-round interview', 'Know the panel’s scope before they explain it.'],
  ['Recruiter screen', 'Twenty minutes, and you set the framing.'],
  ['Networking coffee', 'Skip the warm-up. Start where it’s interesting.'],
  ['Referral ask', 'Ask for the thing they’re actually able to give.'],
  ['Client or sales call', 'Walk in with their quarter, not your pitch.'],
  ['Investor meeting', 'Their last three bets, before you name yours.'],
]
const STEPS = [
  ['1', 'Tell it who you’re meeting', 'A name and a company is enough. Add the context — interview, pitch, coffee — and it aims the research at that.'],
  ['2', 'Watch it work', 'Six angles are planned, then searched at the same time. You can see every query and every source as it lands.'],
  ['3', 'Get your briefing', 'Snapshot, talking points, questions, and the mutual-help read — cited, structured, and short enough to actually use.'],
]
const PROOF = [
  ['Sourced, not guessed', 'Each claim links to the page it came from. If there’s no source, it isn’t in the briefing.'],
  ['Live, not stale', 'Research runs the moment you ask, against the live web — not a snapshot from last year.'],
  ['Yours only', 'Magic-link sign-in, a private account, and briefings nobody else can see.'],
]

const CSS = `
.pp-home a{color:#21395C;text-decoration:none}
.pp-home a:hover{color:#152743;text-decoration:underline;text-underline-offset:3px}
.pp-home ::selection{background:#21395C;color:#F6F3EE}
.pp-home :is(#demo,#how,#start){scroll-margin-top:84px}

@keyframes ppDash{to{background-position:0 12px}}
.pp-dash{animation:ppDash 1.7s linear infinite}

.pp-home [data-reveal]{opacity:0;transform:translateY(20px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.pp-home [data-reveal].pp-in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .pp-home [data-reveal]{opacity:1 !important;transform:none !important;transition:none}
  .pp-dash{animation:none !important}
  html{scroll-behavior:auto}
}

.pp-noline:hover{text-decoration:none !important}
.pp-cta{transition:transform .18s ease,background .18s ease,box-shadow .18s ease}
.pp-cta:hover{background:#17293F;color:#F6F3EE;text-decoration:none}
.pp-cta-hdr:hover{transform:translateY(-1px);box-shadow:0 10px 22px -14px rgba(33,57,92,.9)}
.pp-cta-lg:hover{transform:translateY(-2px);box-shadow:0 14px 28px -16px rgba(33,57,92,.85)}
.pp-cta-close:hover{transform:translateY(-2px);box-shadow:0 16px 30px -16px rgba(33,57,92,.85)}
.pp-sec{transition:border-color .18s ease,transform .18s ease}
.pp-sec:hover{border-color:#17161A;color:#17161A;text-decoration:none;transform:translateY(-2px)}
.pp-row{transition:background .18s ease,transform .18s ease}
.pp-row:hover{background:#F1EDE5;transform:translateX(3px)}
.pp-fcard{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.pp-fcard:hover{transform:translateY(-4px);border-color:#C9C2B5;box-shadow:0 18px 34px -26px rgba(23,22,26,.6)}
.pp-srcpill{transition:transform .18s ease}
.pp-srcpill:hover{transform:translateY(-1px) scale(1.03)}
.pp-use{transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.pp-use:hover{transform:translateY(-4px);border-color:#21395C;box-shadow:0 16px 30px -24px rgba(33,57,92,.8)}
.pp-bx{transition:color .18s ease,border-color .18s ease}
.pp-bx:hover{color:#F6F3EE;border-color:rgba(239,233,223,.6)}
`

const PATH_PAD = ['clamp(24px,4vw,44px) 0', 'clamp(28px,5vw,56px) 0', '0 0 clamp(28px,5vw,56px)']
function FlightPath({ show, variant = 0 }) {
  if (!show) return null
  return (
    <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', padding: PATH_PAD[variant] }}>
      <div className="pp-dash" style={{ width: 1, height: 76, backgroundImage: 'linear-gradient(to bottom,#C7C0B2 0 3px,transparent 3px 12px)', backgroundSize: '1px 12px', backgroundRepeat: 'repeat-y' }} />
    </div>
  )
}

export default function MarketingHome() {
  const rootRef = useRef(null)
  const [showBanner, setShowBanner] = useState(true)
  const showPath = true

  // Scroll reveal via IntersectionObserver (Safari-safe vs. scroll-driven CSS).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll('[data-reveal]'))
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !window.IntersectionObserver) {
      els.forEach((e) => e.classList.add('pp-in'))
      return
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('pp-in'); io.unobserve(en.target) } }),
      { threshold: 0.08 }
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  const kicker = { font: `500 11px/1 ${F_SANS}`, letterSpacing: '.18em', textTransform: 'uppercase', color: '#8C877E' }
  const container = { maxWidth: 1180, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }

  return (
    <div ref={rootRef} className="pp-home" style={{ background: '#F6F3EE', color: '#17161A', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' }}>
      <style>{CSS}</style>

      {/* Seasonal banner — swappable layer */}
      {showBanner && (
        <div data-layer="seasonal-banner" style={{ background: '#17161A', color: '#EFE9DF', padding: '9px clamp(16px,4vw,40px)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ flex: 1, minWidth: 0, font: `400 12.5px/1.5 ${F_SANS}`, color: '#D8D2C7', textWrap: 'pretty' }}>
              ✈ September is the biggest hiring window of the year. Walk into every interview, recruiter call, and coffee chat knowing more than the other candidates.{' '}
              <a href="#demo" style={{ color: '#F6F3EE', textDecoration: 'underline', textUnderlineOffset: 3 }}>See it build a briefing</a>
            </span>
            <button type="button" onClick={() => setShowBanner(false)} aria-label="Dismiss seasonal banner" className="pp-bx"
              style={{ marginLeft: 'auto', flex: 'none', background: 'none', border: '1px solid rgba(239,233,223,.28)', color: '#B9B3A8', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', font: `400 13px/1 ${F_SANS}` }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(246,243,238,.86)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid #E4DED3' }}>
        <div style={{ ...container, padding: '14px clamp(16px,4vw,40px)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#top" className="pp-noline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PlaneMark size={26} />
            <span style={{ font: `500 20px/1 ${F_SERIF}`, letterSpacing: '-.015em', color: '#17161A' }}>PrepPilot</span>
          </a>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.5vw,26px)' }}>
            <a href="#how" style={{ font: `400 13.5px/1 ${F_SANS}`, color: '#55514B' }}>How it works</a>
            <Link to="/login" style={{ font: `400 13.5px/1 ${F_SANS}`, color: '#55514B' }}>Sign in</Link>
            <Link to="/login" className="pp-cta pp-cta-hdr" style={{ font: `500 13.5px/1 ${F_SANS}`, background: '#21395C', color: '#F6F3EE', padding: '11px 16px', borderRadius: 8 }}>Prep my next meeting</Link>
          </nav>
        </div>
      </header>

      <main id="top" style={container}>

        {/* Hero */}
        <section style={{ padding: 'clamp(52px,8vw,96px) 0 clamp(20px,4vw,40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 'clamp(32px,5vw,60px)', alignItems: 'center' }}>
          <div data-reveal>
            <div style={{ ...kicker, marginBottom: 20 }}>Meeting prep, on autopilot</div>
            <h1 style={{ margin: 0, font: `300 clamp(38px,5.2vw,64px)/1.05 ${F_SERIF}`, letterSpacing: '-.022em', color: '#17161A', textWrap: 'pretty' }}>Know exactly who you’re meeting — before you’re in the room.</h1>
            <p style={{ margin: '22px 0 0', maxWidth: '47ch', font: `400 clamp(15px,1.7vw,17.5px)/1.65 ${F_SANS}`, color: '#55514B', textWrap: 'pretty' }}>PrepPilot researches the person and the company across six angles at once, then hands you a structured briefing in about twenty seconds: talking points, sharp questions, and how the two of you can help each other.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 }}>
              <Link to="/login" className="pp-cta pp-cta-lg" style={{ font: `500 14.5px/1 ${F_SANS}`, background: '#21395C', color: '#F6F3EE', padding: '15px 22px', borderRadius: 9 }}>Prep my next meeting →</Link>
              <a href="#demo" className="pp-sec" style={{ font: `500 14.5px/1 ${F_SANS}`, color: '#17161A', padding: '15px 22px', borderRadius: 9, border: '1px solid #D9D2C6', background: '#FCFAF6' }}>Watch it build a briefing ↓</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: 'rgba(46,107,79,.12)', color: '#2E6B4F', font: `500 9px/1 ${F_SANS}` }}>✓</span>
              <span style={{ font: `400 12.5px/1.5 ${F_SANS}`, color: '#8C877E' }}>Every claim cited. Nothing made up.</span>
            </div>
          </div>
          <div data-reveal>
            <BriefingBuilder stage="teaser" speed={1} />
          </div>
        </section>

        <FlightPath show={showPath} variant={0} />

        {/* Watch it think */}
        <section id="demo" style={{ padding: 'clamp(20px,3vw,32px) 0' }} data-reveal>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 16, marginBottom: 26 }}>
            <div>
              <div style={{ ...kicker, marginBottom: 14 }}>Watch it think</div>
              <h2 style={{ margin: 0, font: `300 clamp(28px,3.4vw,42px)/1.12 ${F_SERIF}`, letterSpacing: '-.018em', color: '#17161A' }}>Six angles, searched in parallel, assembled in front of you.</h2>
            </div>
            <p style={{ margin: '0 0 0 auto', maxWidth: '34ch', font: `400 14px/1.6 ${F_SANS}`, color: '#8C877E', textWrap: 'pretty' }}>This is the real thing, running end to end. Nothing here is a mockup of a mockup.</p>
          </div>
          <BriefingBuilder stage="full" speed={1} />
        </section>

        <FlightPath show={showPath} variant={1} />

        {/* Comparison */}
        <section style={{ padding: 'clamp(16px,3vw,28px) 0' }} data-reveal>
          <div style={{ ...kicker, marginBottom: 14 }}>The difference</div>
          <h2 style={{ margin: '0 0 34px', maxWidth: '20ch', font: `300 clamp(28px,3.6vw,46px)/1.1 ${F_SERIF}`, letterSpacing: '-.02em', color: '#17161A' }}>It doesn’t just search. It prepares.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 16 }}>
            {/* Regular agent */}
            <div style={{ border: '1px solid #E4DED3', borderRadius: 14, background: '#FCFAF6', padding: 'clamp(18px,2.5vw,26px)' }}>
              <div style={{ font: `500 10px/1 ${F_SANS}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#A29B90', marginBottom: 18 }}>A regular research agent</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {COMPARE_LEFT.map((row, i) => (
                  <div key={i} className="pp-row" style={{ padding: 12, borderRadius: 8, font: `400 14.5px/1.5 ${F_SANS}`, color: '#8C877E' }}>{row}</div>
                ))}
              </div>
            </div>
            {/* PrepPilot */}
            <div style={{ border: '1px solid #21395C', borderRadius: 14, background: '#FCFAF6', padding: 'clamp(18px,2.5vw,26px)', boxShadow: '0 20px 44px -34px rgba(33,57,92,.7)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <PlaneMark size={15} />
                <span style={{ font: `500 10px/1 ${F_SANS}`, letterSpacing: '.16em', textTransform: 'uppercase', color: '#21395C' }}>PrepPilot</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {COMPARE_RIGHT.map((row, i) => (
                  <div key={i} className="pp-row" style={{ padding: 12, borderRadius: 8, font: `400 14.5px/1.5 ${F_SANS}`, color: '#3B3833' }}>{row}</div>
                ))}
              </div>
            </div>
          </div>

          <figure style={{ margin: 'clamp(28px,4vw,48px) 0 0', borderTop: '1px solid #E4DED3', borderBottom: '1px solid #E4DED3', padding: 'clamp(34px,5vw,58px) clamp(16px,4vw,40px)', background: '#F1EDE5' }}>
            <blockquote style={{ margin: '0 auto', maxWidth: '22ch', textAlign: 'center', font: `300 italic clamp(24px,3.4vw,40px)/1.25 ${F_SERIF}`, letterSpacing: '-.015em', color: '#17161A', textWrap: 'pretty' }}>A summary tells you about someone. A briefing tells you what to do about it.</blockquote>
          </figure>
        </section>

        {/* Four cards */}
        <section style={{ padding: 'clamp(48px,7vw,88px) 0' }} data-reveal>
          <div style={{ ...kicker, marginBottom: 14 }}>In every briefing</div>
          <h2 style={{ margin: '0 0 32px', font: `300 clamp(26px,3.2vw,40px)/1.12 ${F_SERIF}`, letterSpacing: '-.018em', color: '#17161A' }}>Four things, every time.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
            {FEATURES.map(([n, title, body, pill]) => (
              <div key={n} className="pp-fcard" style={{ border: '1px solid #E4DED3', borderRadius: 12, background: '#FCFAF6', padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ font: `400 11px/1 ${F_SERIF}`, color: '#A29B90' }}>{n}</span>
                <h3 style={{ margin: 0, font: `400 20px/1.25 ${F_SERIF}`, color: '#17161A' }}>{title}</h3>
                <p style={{ margin: 0, font: `400 13.5px/1.6 ${F_SANS}`, color: '#6B665F', textWrap: 'pretty' }}>{body}</p>
                {pill && (
                  <span className="pp-srcpill" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, background: 'rgba(46,107,79,.08)', border: '1px solid rgba(46,107,79,.22)', font: `500 10.5px/1.4 ${F_SANS}`, color: '#2E6B4F' }}>✓ Sourced</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <FlightPath show={showPath} variant={2} />

        {/* Use cases */}
        <section style={{ padding: '0 0 clamp(48px,7vw,88px)' }} data-reveal>
          <div style={{ ...kicker, marginBottom: 14 }}>Use it for</div>
          <h2 style={{ margin: '0 0 30px', font: `300 clamp(26px,3.2vw,40px)/1.12 ${F_SERIF}`, letterSpacing: '-.018em', color: '#17161A' }}>Every high-stakes conversation, prepped.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: 12 }}>
            {USE_CASES.map(([title, body]) => (
              <div key={title} className="pp-use" style={{ border: '1px solid #E4DED3', borderRadius: 12, background: '#FCFAF6', padding: '18px 20px' }}>
                <div style={{ font: `400 17px/1.3 ${F_SERIF}`, color: '#17161A', marginBottom: 6 }}>{title}</div>
                <div style={{ font: `400 12.5px/1.55 ${F_SANS}`, color: '#8C877E' }}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" style={{ padding: '0 0 clamp(48px,7vw,88px)' }} data-reveal>
          <div style={{ ...kicker, marginBottom: 14 }}>How it works</div>
          <h2 style={{ margin: '0 0 36px', font: `300 clamp(26px,3.2vw,40px)/1.12 ${F_SERIF}`, letterSpacing: '-.018em', color: '#17161A' }}>Three steps. About twenty seconds.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 'clamp(20px,3vw,36px)' }}>
            {STEPS.map(([n, title, body]) => (
              <div key={n} style={{ borderTop: '1px solid #17161A', paddingTop: 18 }}>
                <div style={{ font: `300 44px/1 ${F_SERIF}`, color: '#C9C2B5', marginBottom: 14 }}>{n}</div>
                <h3 style={{ margin: '0 0 8px', font: `400 21px/1.25 ${F_SERIF}`, color: '#17161A' }}>{title}</h3>
                <p style={{ margin: 0, font: `400 14px/1.6 ${F_SANS}`, color: '#6B665F', textWrap: 'pretty' }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Proof strip */}
        <section style={{ padding: '0 0 clamp(48px,7vw,88px)' }} data-reveal>
          <div style={{ border: '1px solid #E4DED3', borderRadius: 14, background: '#FCFAF6', padding: 'clamp(20px,3vw,32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 'clamp(18px,3vw,32px)' }}>
            {PROOF.map(([title, body]) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(46,107,79,.1)', color: '#2E6B4F', font: `500 11px/1 ${F_SANS}`, flex: 'none', marginTop: 2 }}>✓</span>
                <div>
                  <div style={{ font: `500 14px/1.3 ${F_SANS}`, color: '#17161A', marginBottom: 5 }}>{title}</div>
                  <div style={{ font: `400 13px/1.55 ${F_SANS}`, color: '#8C877E', textWrap: 'pretty' }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section id="start" style={{ padding: '0 0 clamp(56px,8vw,104px)', textAlign: 'center' }} data-reveal>
          <h2 style={{ margin: '0 auto', maxWidth: '16ch', font: `300 clamp(30px,4.6vw,58px)/1.08 ${F_SERIF}`, letterSpacing: '-.022em', color: '#17161A', textWrap: 'pretty' }}>Your next meeting is on the calendar. Walk in ready.</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <Link to="/login" className="pp-cta pp-cta-close" style={{ font: `500 15px/1 ${F_SANS}`, background: '#21395C', color: '#F6F3EE', padding: '16px 26px', borderRadius: 9 }}>Prep my next meeting →</Link>
          </div>
          <p style={{ margin: '20px 0 0', font: `400 12.5px/1.5 ${F_SANS}`, color: '#A29B90' }}>✈ It’s hiring season — there’s no better week to start.</p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E4DED3', background: '#F1EDE5' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(32px,5vw,52px) clamp(16px,4vw,40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <PlaneMark size={22} />
              <span style={{ font: `500 18px/1 ${F_SERIF}`, letterSpacing: '-.015em', color: '#17161A' }}>PrepPilot</span>
            </div>
            <div style={{ font: `400 12.5px/1.6 ${F_SANS}`, color: '#8C877E' }}>Meeting prep, on autopilot.</div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <a href="#how" style={{ font: `400 13px/1 ${F_SANS}`, color: '#55514B' }}>How it works</a>
            <a href="#demo" style={{ font: `400 13px/1 ${F_SANS}`, color: '#55514B' }}>Watch a briefing build</a>
            <Link to="/login" style={{ font: `400 13px/1 ${F_SANS}`, color: '#55514B' }}>Sign in</Link>
          </nav>
          <div style={{ font: `400 12px/1.65 ${F_SANS}`, color: '#A29B90', maxWidth: '34ch', textWrap: 'pretty' }}>Briefings are researched from public web sources and cited. © 2026 PrepPilot.</div>
        </div>
      </footer>
    </div>
  )
}
