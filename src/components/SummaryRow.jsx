import { ds, overlap } from '../lib/utils'

export default function SummaryRow({ jobs, bars, staff, year }) {
  const now = new Date()
  const mStart = ds(new Date(now.getFullYear(), now.getMonth(), 1))
  const mEnd = ds(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  const activeJobs = new Set(bars.filter(b => b.start_date <= mEnd && b.end_date >= mStart).map(b => b.job_id))

  // スケジュール衝突チェック
  const conflictStaff = new Set()
  staff.forEach(s => {
    const sb = bars.filter(b => b.staff_id === s.id && b.year === year)
    for (let i = 0; i < sb.length; i++) {
      for (let j = i + 1; j < sb.length; j++) {
        if (overlap(sb[i], sb[j])) {
          conflictStaff.add(s.id)
        }
      }
    }
  })

  const alertJobs = jobs.filter(j => {
    if (!j.submit_date) return false
    const diff = Math.ceil((new Date(j.submit_date) - now) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  }).sort((a, b) => new Date(a.submit_date) - new Date(b.submit_date))

  const alertHtml = alertJobs.length === 0
    ? <span className="sc-alert-none">なし</span>
    : alertJobs.map(j => {
      const diff = Math.ceil((new Date(j.submit_date) - now) / (1000 * 60 * 60 * 24))
      return (
        <div key={j.id} className="sc-alert-item">
          <span>{j.name}</span>
          <span>提出日 {j.submit_date}（あと{diff}日）</span>
        </div>
      )
    })

  return (
    <div className="summary-row">
      <div className="sc">
        <div className="sc-label">当月の業務数</div>
        <div className="sc-val">{activeJobs.size}</div>
      </div>
      <div className="sc-alert">
        <div className="sc-alert-label">
          提出アラート
          <span style={{ fontSize: 10, color: '#c08050', fontWeight: 400, marginLeft: 6 }}>（7日前にアラート表示）</span>
        </div>
        {alertHtml}
      </div>
      <div className="sc-conflict">
        <div className="sc-label">スケジュール衝突</div>
        <div className="sc-val" style={{ color: conflictStaff.size > 0 ? '#c0440a' : '#1a8a5a' }}>
          {conflictStaff.size}名
        </div>
      </div>
    </div>
  )
}
