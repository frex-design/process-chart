import { jobColor, ds } from '../lib/utils'

export default function Legend({ jobs, today, onEdit }) {
  const activeJobs = jobs.filter(j => !j.contract_end || j.contract_end >= today)
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
          <div key={j.id} className="legend-item" onClick={() => onEdit(j)}>
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
                <span key={j.id} className="legend-item" style={{ color: '#aaa' }} onClick={() => onEdit(j)}>
                  <span className="legend-dot" style={{ background: '#ccc', display: 'inline-block' }} />
                  {j.name}
                </span>
              ))}
            </span>
          ))}
        </div>
      )}
    </>
  )
}
