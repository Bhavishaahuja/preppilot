import { useNavigate } from 'react-router-dom'
import { useBriefing } from '../BriefingContext'

// Friendly date like "Aug 30, 2026" for the list rows.
function longDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return ""
  }
}

function History() {
  const { history, historyLoaded, openBriefing, deleteBriefing } = useBriefing()
  const navigate = useNavigate()

  function handleOpen(row) {
    openBriefing(row)
    navigate("/briefing")
  }

  function handleDelete(e, id) {
    e.stopPropagation()   // don't open the briefing when deleting
    deleteBriefing(id)
  }

  return (
    <div className="flex justify-center px-14 pt-14 pb-20">
      <div className="w-[760px] flex flex-col gap-8">

        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-faint2">Your briefings</span>
          <h1 className="font-serif text-[38px] leading-[1.08] font-light tracking-[-0.02em] text-ink">Past briefings</h1>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-muted">
            Every briefing you've generated, saved to your account. Open one to read it again or export it.
          </p>
        </div>

        {/* Empty / loading / list */}
        {!historyLoaded ? (
          <div className="flex justify-center py-16">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#BCC6D6] border-t-accent" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-card px-8 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
            </div>
            <h2 className="font-serif text-2xl font-medium">No briefings yet</h2>
            <p className="max-w-[380px] text-[14.5px] text-muted">Your generated briefings will show up here so you can revisit them anytime.</p>
            <button onClick={() => navigate("/new")} className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-[14.5px] font-medium text-white hover:bg-accent-ink">
              Build your first briefing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((row) => {
              const sourceCount = (row.data?.sources || []).length
              return (
                <div
                  key={row.id}
                  onClick={() => handleOpen(row)}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-line bg-card p-5 hover:border-accent"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif text-[20px] font-medium leading-tight text-ink">{row.person || "Contact"}</span>
                      <span className="text-[#A29B90]">/</span>
                      <span className="text-[15px] text-muted">{row.company}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-faint">
                      <span>{longDate(row.created_at)}</span>
                      {sourceCount > 0 && (
                        <>
                          <span className="text-[#C9C2B5]">•</span>
                          <span className="inline-flex items-center gap-1 text-verified">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                            {sourceCount} sources
                          </span>
                        </>
                      )}
                    </div>
                    {row.goal && <div className="mt-0.5 line-clamp-1 text-[13.5px] text-[#6B665F]">Goal: {row.goal}</div>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent opacity-0 transition group-hover:opacity-100">
                    Open
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, row.id)}
                    title="Delete briefing"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-faint hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default History
