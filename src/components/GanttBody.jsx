import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ds, jobColor, getHolidays, COL, PHASES, overlap } from '../lib/utils'

export default function GanttBody({
  days, year, today,
  jobs, staff, cars,
  bars, carBars,
  setBars, setCarBars,
  onRefresh,
  readOnly = false,
  memos = {}
}) {
  const [dragState, setDragState] = useState(null)
  const [tip, setTip] = useState(null) // {text, x, y}
  const dragRef = useRef(null)
  const allH = { ...getHolidays(year), ...getHolidays(year + 1) }

  const staffList = staff.filter(s => s.category === 'staff')
  const bossyList = staff.filter(s => s.category === 'bossy')
  const driverList = staff.filter(s => s.category === 'driver')

  function dayIdx(str) { return days.findIndex(d => ds(d) === str) }

  // 衝突チェック
  function conflictDays(sid) {
    const sb = bars.filter(b => b.staff_id === sid && b.year === year)
    const set = new Set()
    for (let i = 0; i < sb.length; i++)
      for (let j = i + 1; j < sb.length; j++)
        if (overlap(sb[i], sb[j])) {
          const si = Math.max(dayIdx(sb[i].start_date), dayIdx(sb[j].start_date))
          const ei = Math.min(dayIdx(sb[i].end_date), dayIdx(sb[j].end_date))
          for (let x = si; x <= ei; x++) if (x >= 0) set.add(x)
        }
    return set
  }

  function cellClass(d, di, isConflict, isCarCell) {
    const isT = ds(d) === today
    const dow = d.getDay()
    const isMonthEnd = di === days.length - 1 || days[di + 1].getMonth() !== d.getMonth()
    const hName = allH[ds(d)] || ''
    const base = isCarCell ? 'day-cell-sm' : 'day-cell'
    let cls = base
    if (isConflict) cls += ' conflict'
    else if (isT) cls += ' today-col'
    else if (hName) cls += ' holiday-col'
    else if (dow === 0) cls += ' sun'
    else if (dow === 6) cls += ' sat'
    if (isMonthEnd) cls += ' month-boundary'
    return cls
  }

  // セルクリック→新規バー
  function onCellClick(staffId, di, isDriver) {
    const dateStr = ds(days[di])
    if (isDriver) {
      window._openDriverBar({ staffId, start: dateStr, end: dateStr })
    } else {
      window._openNewBar({ staffId, start: dateStr, end: dateStr })
    }
  }
  function onCarCellClick(carId, di) {
    window._openCarBar({ carId, start: ds(days[di]), end: ds(days[di]) })
  }

  // バーのドラッグ
  function onBarMouseDown(e, bar, kind) {
    if (readOnly) {
      // スマホ：タップで編集ポップアップを開く
      if (kind === 'bar') window._openBarDetail(bar)
      else window._openCarBarDetail(bar)
      return
    }
    e.preventDefault(); e.stopPropagation()
    const rh = e.target.closest('.rh')
    const side = rh ? rh.dataset.side : null
    const type = side ? 'resize' : 'move'
    dragRef.current = {
      type, kind, bar: { ...bar }, side,
      origStart: bar.start_date, origEnd: bar.end_date,
      origStaff: bar.staff_id, origCar: bar.car_id,
      startX: e.clientX, moved: false
    }
    const onMove = (ev) => {
      const dr = dragRef.current; if (!dr) return
      const dx = ev.clientX - dr.startX
      const delta = Math.round(dx / COL)
      if (Math.abs(dx) > 3) dr.moved = true
      const si = dayIdx(dr.origStart), ei = dayIdx(dr.origEnd), dur = ei - si
      if (dr.type === 'move') {
        const nsi = Math.max(0, Math.min(days.length - 1 - dur, si + delta))
        dr.bar.start_date = ds(days[nsi])
        dr.bar.end_date = ds(days[nsi + dur])
        // 行移動
        const el = document.elementFromPoint(ev.clientX, ev.clientY)
        if (kind === 'bar') {
          const td = el?.closest('[data-staff]')
          if (td) dr.bar.staff_id = parseInt(td.dataset.staff)
        } else {
          const td = el?.closest('[data-car]')
          if (td) dr.bar.car_id = parseInt(td.dataset.car)
        }
      } else {
        if (dr.side === 'r') dr.bar.end_date = ds(days[Math.max(si, Math.min(days.length - 1, ei + delta))])
        else dr.bar.start_date = ds(days[Math.min(ei, Math.max(0, si + delta))])
      }
      // ライブ更新
      if (kind === 'bar') setBars(prev => prev.map(b => b.id === dr.bar.id ? { ...b, start_date: dr.bar.start_date, end_date: dr.bar.end_date, staff_id: dr.bar.staff_id } : b))
      else setCarBars(prev => prev.map(b => b.id === dr.bar.id ? { ...b, start_date: dr.bar.start_date, end_date: dr.bar.end_date, car_id: dr.bar.car_id } : b))
    }
    const onUp = async (ev) => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      const dr = dragRef.current; if (!dr) return
      if (!dr.moved) {
        // クリック→詳細
        if (kind === 'bar') window._openBarDetail(bar)
        else window._openCarBarDetail(bar)
        dragRef.current = null; return
      }
      // DB保存
      if (kind === 'bar') {
        await supabase.from('bars').update({
          start_date: dr.bar.start_date, end_date: dr.bar.end_date, staff_id: dr.bar.staff_id
        }).eq('id', dr.bar.id)
      } else {
        await supabase.from('car_bars').update({
          start_date: dr.bar.start_date, end_date: dr.bar.end_date, car_id: dr.bar.car_id
        }).eq('id', dr.bar.id)
      }
      dragRef.current = null
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const PULSE_PHASES = ["現地踏査", "定期点検"]

  function renderBar(b, di, isSmall, showPhase) {
    const si = Math.max(0, dayIdx(b.start_date))
    if (si !== di) return null
    const ei = Math.min(days.length - 1, dayIdx(b.end_date))
    const w = (ei - si + 1) * COL - 2
    const color = jobColor(b.job_id, jobs)
    const jn = (jobs.find(x => x.id === b.job_id) || { name: '?' }).name
    const sn = jn.length > 5 ? jn.slice(0, 5) + '…' : jn
    const label = showPhase ? `${b.phase} / ${sn}` : sn
    const isPulse = PULSE_PHASES.includes(b.phase)
    const barCls = isSmall ? 'bar-sm' : 'bar'
    const fontSize = isSmall ? 10 : 12
    const top = isSmall ? 5 : 6
    const height = isSmall ? 24 : 30
    return (
      <div
        key={b.id}
        className={barCls + (isPulse ? ' bar-pulse' : '')}
        style={{ left: 1, top, height, width: w, background: color, color: '#fff', fontSize }}
        onMouseDown={e => onBarMouseDown(e, b, 'bar')}
        onMouseEnter={e => {
          const jn = (jobs.find(x => x.id === b.job_id) || { name: '?' }).name
          const text = b.phase ? `${b.phase} / ${jn}` : jn
          setTip({ text, x: e.clientX, y: e.clientY })
        }}
        onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
        onMouseLeave={() => setTip(null)}
      >
        <div className="rh" data-side="l">|</div>
        <div className="bar-label">{label}</div>
        <div className="rh" data-side="r">|</div>
      </div>
    )
  }

  function renderCarBar(b, di) {
    const si = Math.max(0, dayIdx(b.start_date))
    if (si !== di) return null
    const ei = Math.min(days.length - 1, dayIdx(b.end_date))
    const w = (ei - si + 1) * COL - 2
    const color = jobColor(b.job_id, jobs)
    const jn = (jobs.find(x => x.id === b.job_id) || { name: '?' }).name
    const sn = jn.length > 7 ? jn.slice(0, 7) + '…' : jn
    return (
      <div
        key={b.id}
        className="bar-sm"
        style={{ left: 1, top: 5, height: 24, width: w, background: color, color: '#fff', fontSize: 10 }}
        onMouseDown={e => onBarMouseDown(e, b, 'carbar')}
        onMouseEnter={e => {
          const jn = (jobs.find(x => x.id === b.job_id) || { name: '?' }).name
          const car = (cars.find(x => x.id === b.car_id) || { name: '?' }).name
          setTip({ text: `${car} / ${jn}`, x: e.clientX, y: e.clientY })
        }}
        onMouseMove={e => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
        onMouseLeave={() => setTip(null)}
      >
        <div className="rh" data-side="l">|</div>
        <div className="bar-label">{sn}</div>
        <div className="rh" data-side="r">|</div>
      </div>
    )
  }

  function renderPersonRow(s, isSmall, isDriver) {
    const sb = bars.filter(b => b.staff_id === s.id && b.year === year)
    const cDays = isSmall ? new Set() : conflictDays(s.id)
    const thCls = isSmall ? 'staff-th-sm' : 'staff-th'
    const cat = isSmall ? (isDriver ? 'driver' : 'bossy') : 'staff'
    return (
      <tr key={s.id} data-staff={s.id}>
        <td className={thCls}>
          <button className="staff-name-btn" onClick={() => window._openPersonEdit(s, cat)}>{s.name}</button>
        </td>
        {days.map((d, di) => {
          const isConflict = cDays.has(di)
          const isT = ds(d) === today
          return (
            <td
              key={di}
              className={cellClass(d, di, isConflict, isSmall)}
              data-staff={s.id}
              onClick={e => { if (e.target.closest('.bar,.bar-sm,.rh')) return; onCellClick(s.id, di, isDriver) }}
            >
              {isConflict && <div className="conflict-dot" />}
              {isT && <div className="today-marker" />}
              {sb.map(b => renderBar(b, di, isSmall, !isDriver))}
            </td>
          )
        })}
      </tr>
    )
  }

  function renderCarRow(car) {
    const cb = carBars.filter(b => b.car_id === car.id && b.year === year)
    return (
      <tr key={car.id} data-car={car.id}>
        <td className="staff-th-sm" style={{ background: '#f0f8f0' }}>
          <button className="staff-name-btn" style={{ color: '#1a8a5a' }} onClick={() => window._openCarEdit(car)}>{car.name}</button>
        </td>
        {days.map((d, di) => {
          const isT = ds(d) === today
          return (
            <td
              key={di}
              className={cellClass(d, di, false, true)}
              data-car={car.id}
              onClick={e => { if (e.target.closest('.bar,.bar-sm,.rh')) return; onCarCellClick(car.id, di) }}
            >
              {isT && <div className="today-marker" />}
              {cb.map(b => renderCarBar(b, di))}
            </td>
          )
        })}
      </tr>
    )
  }

  function sectionRow(label, labelCls, fillCls) {
    return (
      <tr key={'sec-' + label}>
        <td className={labelCls}>{label}</td>
        {days.map((d, di) => {
          const isMonthEnd = di === days.length - 1 || days[di + 1].getMonth() !== d.getMonth()
          return <td key={di} className={fillCls + (isMonthEnd ? ' month-boundary' : '')} />
        })}
      </tr>
    )
  }

  function dividerRow() {
    return (
      <tr key="divider">
        <td className="divider-label" />
        {days.map((d, di) => {
          const isMonthEnd = di === days.length - 1 || days[di + 1].getMonth() !== d.getMonth()
          return <td key={di} className={'divider-cell' + (isMonthEnd ? ' month-boundary' : '')} />
        })}
      </tr>
    )
  }

  function memoRow() {
    const mSpans = []
    let cur = null
    days.forEach((d, i) => {
      const k = d.getFullYear() + '-' + (d.getMonth() + 1)
      if (!cur || cur.k !== k) { if (cur) mSpans.push(cur); cur = { k, lbl: (d.getMonth() + 1) + '月', s: i, n: 1 } }
      else cur.n++
    })
    if (cur) mSpans.push(cur)
    return (
      <tr key="memo">
        <td className="memo-label">メモ</td>
        {mSpans.map((m, mi) => {
          const lastDi = m.s + m.n - 1
          const isMonthEnd = lastDi === days.length - 1 || days[lastDi + 1]?.getMonth() !== days[lastDi]?.getMonth()
          return (
            <td
              key={m.k}
              className={'memo-cell' + (isMonthEnd ? ' month-boundary' : '')}
              colSpan={m.n}
              onClick={() => window._openMemo(m.k, m.lbl)}
            >
              <div className="memo-text">{memos[m.k] || ''}</div>
            </td>
          )
        })}
      </tr>
    )
  }

  const nameColWidth = readOnly ? 100 : 140

  const colgroup = (
    <colgroup>
      <col style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }} />
      {days.map((_, i) => <col key={i} style={{ width: COL, minWidth: COL }} />)}
    </colgroup>
  )

  return (
    <>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        {colgroup}
        <tbody>
          {sectionRow('社員', 'section-label', 'section-fill')}
          {staffList.map(s => renderPersonRow(s, false, false))}
          {dividerRow()}
          {sectionRow('配車', 'section-label-car', 'section-fill-car')}
          {cars.map(c => renderCarRow(c))}
          {sectionRow('補助', 'section-label-partner', 'section-fill-partner')}
          {bossyList.map(s => renderPersonRow(s, true, false))}
          {sectionRow('運転', 'section-label-partner', 'section-fill-partner')}
          {driverList.map(s => renderPersonRow(s, true, true))}
          {memoRow()}
        </tbody>
      </table>
      {tip && (
        <div style={{
          position: 'fixed', left: tip.x + 12, top: tip.y - 10, zIndex: 1000,
          background: '#fff', border: '0.5px solid #ccc', borderRadius: 8,
          padding: '6px 10px', fontSize: 12, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)', whiteSpace: 'nowrap'
        }}>
          {tip.text}
        </div>
      )}
    </>
  )
}
