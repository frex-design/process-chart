import { useState } from 'react'
import { jobColor, ds } from '../lib/utils'

function Tooltip({ job, x, y }) {
  if (!job) return null
  const lines = []
  if (job.contract_start || job.contract_end)
    lines.push(`契約工期：${job.contract_start || '—'} 〜 ${job.contract_end || '—'}`)
  if (job.submit_date)
    lines.push(`提出日：${job.submit_date}`)
  if (lines.length === 0) return null
  return (
    <div style={{
      position: 'fixed', left: x + 12, top: y - 10, zIndex: 1000,
      background: '#fff', border: '0.5px solid #ccc', borderRadius: 8,
      padding: '8px 10px', fontSize: 11, pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)', maxWidth: 280, whiteSpace: 'nowrap'
    }}>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{job.name}</div>
      {lines.map((l, i) => <div key={i} style={{ color: '#555' }}>{l}</div>)}
    </div>
  )
}

export default function Legend({ jobs, today, onEdit }) {
  const [tip, setTip] = useState(null) // {job, x, y}

  const BOTTOM_JOBS = ['その他', '有給休暇']

  const sortJobs = (list) => {
    const bottom = list.filter(j => BOTTOM_JOBS.includes(j.name))
    const others = list.filter(j => !BOTTOM_JOBS.includes(j.name))
    return [...others, ...bottom]
  }

  const activeJobs = sortJobs(jobs.filter(j => !j.contract_end || j.contract_end >= today))
  const endedJobs = jobs.filter(j => j.contract_end && j.contract_end < today)

  const byYear = {}
  endedJobs.forEach(j => {
    const d = new Date(j.contract_end)
    const yr = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear()
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(j)
  })

  return (
    <>
      <div className="legend">
        {activeJobs.map(j => (
          <div
            key={j.id} className="legend-item"
            onClick={() => onEdit(j)}
            onMouseEnter={e => setTip({ job: j, x: e.clientX, y: e.clientY })}
            onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setTip(null)}
          >
            <div className="legend-dot" style={{ background: jobColor(j.id, jobs) }} />
            {j.name}
          </div>
        ))}
      </div>
      {endedJobs.length > 0 && (
        <div className="legend-ended">
          <span className="legend-ended-label">終了業務：</span>
          {Object.keys(byYear).sort().map(yr => (
            <span key={yr} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#bbb' }}>{yr}年度</span>
              {byYear[yr].map(j => (
                <span
                  key={j.id} className="legend-item" style={{ color: '#aaa' }}
                  onClick={() => onEdit(j)}
                  onMouseEnter={e => setTip({ job: j, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  <span className="legend-dot" style={{ background: '#ccc', display: 'inline-block' }} />
                  {j.name}
                </span>
              ))}
            </span>
          ))}
        </div>
      )}
      {tip && <Tooltip job={tip.job} x={tip.x} y={tip.y} />}
    </>
  )
}
