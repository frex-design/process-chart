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

const BOTTOM_JOBS = ['その他', '有給休暇']

export default function Legend({ jobs, today, onEdit }) {
  const [tip, setTip] = useState(null)

  const activeJobs = jobs.filter(j => !j.contract_end || j.contract_end >= today)
  const endedJobs = jobs.filter(j => j.contract_end && j.contract_end < today)

  // 通常業務と固定業務に分離
  const normalJobs = activeJobs.filter(j => !BOTTOM_JOBS.includes(j.name))
  const fixedJobs = activeJobs.filter(j => BOTTOM_JOBS.includes(j.name))

  const byYear = {}
  endedJobs.forEach(j => {
    const d = new Date(j.contract_end)
    const yr = d.getMonth() < 3 ? d.getFullYear() - 1 : d.getFullYear()
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(j)
  })

  const LegendItem = ({ j, style = {} }) => (
    <div
      className="legend-item"
      style={style}
      onClick={() => onEdit(j)}
      onMouseEnter={e => setTip({ job: j, x: e.clientX, y: e.clientY })}
      onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
      onMouseLeave={() => setTip(null)}
    >
      <div className="legend-dot" style={{ background: jobColor(j.id, jobs) }} />
      {j.name}
    </div>
  )

  return (
    <>
      <div className="legend" style={{ justifyContent: 'space-between' }}>
        {/* 通常業務（左側） */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {normalJobs.map(j => <LegendItem key={j.id} j={j} />)}
        </div>
        {/* 固定業務（右端） */}
        {fixedJobs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', borderLeft: '1px solid #e0e0dc', paddingLeft: 8, marginLeft: 4 }}>
            {fixedJobs.map(j => <LegendItem key={j.id} j={j} />)}
          </div>
        )}
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
