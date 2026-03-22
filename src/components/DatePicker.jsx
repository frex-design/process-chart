import { useState, useEffect, useRef } from 'react'

function getHolidays(year) {
  const h = {}
  const add = (m, d, n) => { h[`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = n }
  add(1,1,'元日'); add(2,11,'建国記念日'); add(2,23,'天皇誕生日')
  add(3,20,'春分の日'); add(4,29,'昭和の日'); add(5,3,'憲法記念日')
  add(5,4,'みどりの日'); add(5,5,'こどもの日'); add(7,15,'海の日')
  add(8,11,'山の日'); add(9,16,'敬老の日'); add(9,23,'秋分の日')
  add(10,13,'スポーツの日'); add(11,3,'文化の日'); add(11,23,'勤労感謝の日')
  return h
}

const TODAY = new Date().toISOString().slice(0, 10)

export default function DatePicker({ value, onChange, placeholder = '未設定' }) {
  const [open, setOpen] = useState(false)
  const [curYear, setCurYear] = useState(() => {
    const d = value ? new Date(value) : new Date()
    return d.getFullYear()
  })
  const [curMonth, setCurMonth] = useState(() => {
    const d = value ? new Date(value) : new Date()
    return d.getMonth()
  })
  const popRef = useRef(null)
  const triggerRef = useRef(null)
  const [popStyle, setPopStyle] = useState({})

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    setTimeout(() => document.addEventListener('click', handleClick), 10)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  function handleOpen() {
    if (value) {
      const d = new Date(value)
      setCurYear(d.getFullYear())
      setCurMonth(d.getMonth())
    }
    // 位置計算
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const pw = 240, ph = 280
      let left = rect.left, top = rect.bottom + 4
      if (left + pw > window.innerWidth) left = window.innerWidth - pw - 8
      if (top + ph > window.innerHeight) top = rect.top - ph - 4
      setPopStyle({ position: 'fixed', left, top, zIndex: 2000 })
    }
    setOpen(v => !v)
  }

  function move(delta) {
    let m = curMonth + delta
    let y = curYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setCurMonth(m)
    setCurYear(y)
  }

  function select(dateStr) {
    onChange(dateStr)
    setOpen(false)
  }

  function clear() {
    onChange('')
    setOpen(false)
  }

  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const DOW = ['日','月','火','水','木','金','土']
  const holidays = getHolidays(curYear)
  const first = new Date(curYear, curMonth, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate()

  const displayVal = value ? value.replace(/-/g, '/') : null

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      {/* トリガー */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          width: '100%', fontSize: 12, padding: '5px 8px',
          border: '0.5px solid #ccc', borderRadius: 8, background: '#fff',
          cursor: 'pointer', height: 32, display: 'flex', alignItems: 'center',
          gap: 6, boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: 13, color: '#888' }}>📅</span>
        <span style={{ flex: 1, color: displayVal ? '#1a1a1a' : '#aaa', fontSize: 12 }}>
          {displayVal || placeholder}
        </span>
      </div>

      {/* ポップアップ */}
      {open && (
        <div
          ref={popRef}
          style={{
            ...popStyle,
            background: '#fff', border: '0.5px solid #ccc', borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)', padding: 12, width: 240
          }}
        >
          {/* ヘッダー */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              onClick={() => move(-1)}
              style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#555', padding: '2px 8px', borderRadius: 6 }}
            >‹</button>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{curYear}年 {MONTHS[curMonth]}</span>
            <button
              onClick={() => move(1)}
              style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#555', padding: '2px 8px', borderRadius: 6 }}
            >›</button>
          </div>

          {/* グリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {DOW.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10, padding: '2px 0', fontWeight: 500,
                color: i === 0 ? '#c0440a' : i === 6 ? '#2a5bbf' : '#aaa'
              }}>{d}</div>
            ))}
            {Array(startDow).fill(null).map((_, i) => <div key={'e' + i} />)}
            {Array(daysInMonth).fill(null).map((_, idx) => {
              const d = idx + 1
              const dateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dow = new Date(curYear, curMonth, d).getDay()
              const hName = holidays[dateStr] || ''
              const isToday = dateStr === TODAY
              const isSelected = dateStr === value
              let color = '#1a1a1a'
              if (hName) color = '#b03070'
              else if (dow === 0) color = '#c0440a'
              else if (dow === 6) color = '#2a5bbf'
              return (
                <div
                  key={d}
                  onClick={() => select(dateStr)}
                  style={{
                    textAlign: 'center', fontSize: 11, padding: '3px 0', borderRadius: 6,
                    cursor: 'pointer', lineHeight: 1.2,
                    background: isSelected ? '#185FA5' : 'transparent',
                    color: isSelected ? '#fff' : color,
                    fontWeight: isToday ? 700 : 400,
                    outline: isToday && !isSelected ? '1.5px solid #185FA5' : 'none'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f0f0ee' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <div>{d}</div>
                  {hName && <div style={{ fontSize: 7, color: isSelected ? '#fff' : '#b03070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hName}</div>}
                </div>
              )
            })}
          </div>

          {/* クリア */}
          <div style={{ marginTop: 8, textAlign: 'center' }}>
            <button
              onClick={clear}
              style={{ fontSize: 11, color: '#888', background: 'none', border: '0.5px solid #ddd', borderRadius: 6, padding: '3px 12px', cursor: 'pointer' }}
            >クリア</button>
          </div>
        </div>
      )}
    </div>
  )
}
