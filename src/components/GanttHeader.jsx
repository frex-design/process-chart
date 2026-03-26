import { useState } from 'react'
import { ds, getHolidays, COL } from '../lib/utils'

export default function GanttHeader({ days, memos, today, onMemoClick }) {
  const [tip, setTip] = useState(null) // {key, lbl, x, y}
  const year = days[0]?.getFullYear()
  const allH = { ...getHolidays(year), ...getHolidays(year + 1) }

  // 月スパン
  const mSpans = []
  let cur = null
  days.forEach((d, i) => {
    const k = d.getFullYear() + '-' + (d.getMonth() + 1)
    const lbl = (d.getMonth() + 1) + '月'
    if (!cur || cur.k !== k) {
      if (cur) mSpans.push(cur)
      cur = { k, lbl, n: 1 }
    } else cur.n++
  })
  if (cur) mSpans.push(cur)

  return (
    <>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="name-th" style={{ borderTop: 'none' }}>氏名</th>
            {mSpans.map(m => {
              const memo = memos[m.k] || ''
              const hasMemo = memo.trim() !== ''
              return (
                <th
                  key={m.k}
                  className="month-th"
                  colSpan={m.n}
                  style={{ background: hasMemo ? '#fffbe6' : undefined, cursor: 'pointer' }}
                  onClick={() => onMemoClick(m.k, m.lbl)}
                  onMouseEnter={e => setTip({ key: m.k, lbl: m.lbl, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  {m.lbl}{hasMemo && <span style={{ color: '#b07a00', fontSize: 9 }}>●</span>}
                </th>
              )
            })}
          </tr>
          <tr>
            <th className="name-th" style={{ borderTop: 'none' }}></th>
            {days.map((d, i) => {
              const dow = d.getDay()
              const isT = ds(d) === today
              const isMonthEnd = i === days.length - 1 || days[i + 1].getMonth() !== d.getMonth()
              const hName = allH[ds(d)] || ''
              let cls = 'day-th'
              if (hName) cls += ' holiday-h'
              else if (dow === 0) cls += ' sun'
              else if (dow === 6) cls += ' sat'
              if (isT) cls += ' today-h'
              if (isMonthEnd) cls += ' month-boundary'
              return (
                <th key={i} className={cls} title={hName || undefined} style={{ width: COL, minWidth: COL }}>
                  {isT && <div className="today-marker" />}
                  {d.getDate()}
                </th>
              )
            })}
          </tr>
        </thead>
      </table>

      {/* メモツールチップ */}
      {tip && (() => {
        const memo = memos[tip.key] || ''
        return (
          <div style={{
            position: 'fixed', left: tip.x + 12, top: tip.y - 10, zIndex: 1000,
            background: '#fff', border: '0.5px solid #ccc', borderRadius: 8,
            padding: '8px 10px', fontSize: 11, pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', maxWidth: 260, whiteSpace: 'pre-wrap'
          }}>
            <div style={{ fontWeight: 500, marginBottom: 4, color: '#b07a00' }}>{tip.lbl}のメモ</div>
            {memo.trim()
              ? <div style={{ color: '#555' }}>{memo}</div>
              : <div style={{ color: '#aaa' }}>（未入力 — クリックで編集）</div>
            }
          </div>
        )
      })()}
    </>
  )
}
