import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { ds, buildDays, jobColor, getHolidays, COL, PHASES, overlap } from './lib/utils'
import GanttHeader from './components/GanttHeader'
import GanttBody from './components/GanttBody'
import SummaryRow from './components/SummaryRow'
import Legend from './components/Legend'
import Modals from './components/Modals'
import './App.css'

const TODAY = ds(new Date())
const NOW_YEAR = new Date().getMonth() < 3 ? new Date().getFullYear() - 1 : new Date().getFullYear()
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768

export default function App() {
  const [year, setYear] = useState(NOW_YEAR)
  const [years, setYears] = useState([2025, 2026])
  const [days, setDays] = useState(() => buildDays(NOW_YEAR))
  const [jobs, setJobs] = useState([])
  const [staff, setStaff] = useState([])
  const [cars, setCars] = useState([])
  const [customers, setCustomers] = useState([])
  const [bars, setBars] = useState([])
  const [carBars, setCarBars] = useState([])
  const [memos, setMemos] = useState({})
  const [loading, setLoading] = useState(true)
  const headerRef = useRef(null)
  const mainRef = useRef(null)

  // 初期データ取得
  useEffect(() => {
    fetchAll()
    setupRealtime()
  }, [])

  // データ読み込み完了後に当月へスクロール
  useEffect(() => {
    if (!loading) {
      scrollToCurrentMonth()
    }
  }, [loading])

  useEffect(() => {
    setDays(buildDays(year))
  }, [year])

  function scrollToCurrentMonth() {
    const now = new Date()
    const nowYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()
    if (year !== nowYear) return
    setTimeout(() => {
      if (!mainRef.current) return
      const currentDays = buildDays(year)
      const monthStart = currentDays.findIndex(d => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
      if (monthStart >= 0) mainRef.current.scrollLeft = monthStart * COL
    }, 300)
  }

  async function fetchAll() {
    const scrollX = mainRef.current ? mainRef.current.scrollLeft : -1
    setLoading(true)
    const [j, s, c, cu, b, cb, m, y] = await Promise.all([
      supabase.from('jobs').select('*').order('id'),
      supabase.from('staff').select('*').order('sort_order'),
      supabase.from('cars').select('*').order('sort_order'),
      supabase.from('customers').select('*').order('sort_order'),
      supabase.from('bars').select('*'),
      supabase.from('car_bars').select('*'),
      supabase.from('memos').select('*'),
      supabase.from('years').select('*').order('year'),
    ])
    if (j.data) setJobs(j.data)
    if (s.data) setStaff(s.data)
    if (c.data) setCars(c.data)
    if (cu.data) setCustomers(cu.data)
    if (b.data) setBars(b.data)
    if (cb.data) setCarBars(cb.data)
    if (m.data) {
      const memo = {}
      m.data.forEach(r => { memo[r.month_key] = r.content })
      setMemos(memo)
    }
    if (y.data) setYears(y.data.map(r => r.year))
    setLoading(false)
    if (scrollX >= 0) {
      setTimeout(() => { if (mainRef.current) mainRef.current.scrollLeft = scrollX }, 100)
    }
  }

  function setupRealtime() {
    supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bars' }, () => fetchBars())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'car_bars' }, () => fetchCarBars())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => fetchJobs())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => fetchStaff())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, () => fetchCars())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchCustomers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memos' }, () => fetchMemos())
      .subscribe()
  }

  async function fetchBars() {
    const { data } = await supabase.from('bars').select('*')
    if (data) setBars(data)
  }
  async function fetchCarBars() {
    const { data } = await supabase.from('car_bars').select('*')
    if (data) setCarBars(data)
  }
  async function fetchJobs() {
    const { data } = await supabase.from('jobs').select('*').order('id')
    if (data) setJobs(data)
  }
  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('sort_order')
    if (data) setStaff(data)
  }
  async function fetchCars() {
    const { data } = await supabase.from('cars').select('*').order('sort_order')
    if (data) setCars(data)
  }
  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('sort_order')
    if (data) setCustomers(data)
  }
  async function fetchMemos() {
    const { data } = await supabase.from('memos').select('*')
    if (data) {
      const memo = {}
      data.forEach(r => { memo[r.month_key] = r.content })
      setMemos(memo)
    }
  }

  // 横スクロール同期
  function onHeaderScroll(e) {
    if (mainRef.current) mainRef.current.scrollLeft = e.target.scrollLeft
  }
  function onMainScroll(e) {
    if (headerRef.current) headerRef.current.scrollLeft = e.target.scrollLeft
  }

  // 年度切替
  async function handleYearChange(e) {
    const val = e.target.value
    if (val === '__add__') {
      const maxYear = Math.max(...years)
      const newYear = maxYear + 1
      await supabase.from('years').insert({ year: newYear })
      setYears(prev => [...prev, newYear])
      setYear(newYear)
      setTimeout(() => { if (mainRef.current) mainRef.current.scrollLeft = 0 }, 200)
    } else {
      const y = parseInt(val)
      setYear(y)
      setTimeout(() => {
        if (!mainRef.current) return
        if (y === NOW_YEAR) {
          const now = new Date()
          const newDays = buildDays(y)
          const monthStart = newDays.findIndex(d => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
          if (monthStart >= 0) mainRef.current.scrollLeft = monthStart * COL
        } else {
          mainRef.current.scrollLeft = 0
        }
      }, 200)
    }
  }

  const now = new Date()
  const week = ['日','月','火','水','木','金','土']
  const todayLabel = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（${week[now.getDay()]}）`

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'14px', color:'#666' }}>
      読み込み中...
    </div>
  )

  return (
    <div className="wrap">
      <div className="header">
        <div className="title-text">FRe:x Design inc. | 工程管理表</div>
        <div className="controls">
          {!IS_MOBILE && (
            <a href="https://frex-design.github.io/Accommodation-management/" target="_blank" rel="noopener" className="btn">出張宿泊管理システム</a>
          )}
          <span className="today-disp">{todayLabel}</span>
          <select value={year} onChange={handleYearChange}>
            {years.map(y => <option key={y} value={y}>{y}年度</option>)}
            {!IS_MOBILE && <option value="__add__">＋ {Math.max(...years)+1}年度を追加</option>}
          </select>
          {!IS_MOBILE && <>
            <button className="btn" onClick={() => window._openModal('staff')}>+ 社員追加</button>
            <button className="btn" onClick={() => window._openModal('customer')}>+ 顧客追加</button>
            <button className="btn" onClick={() => window._openModal('partner')}>+ 協力会社追加</button>
            <button className="btn" onClick={() => window._openModal('car')}>+ 社用車追加</button>
          </>}
        </div>
      </div>

      {!IS_MOBILE && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => window._openModal('job')}
            style={{
              background: 'linear-gradient(135deg, #185FA5, #0e7090)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '0 20px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(24,95,165,0.25)',
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.03em'
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 300 }}>＋</span> 業務追加
          </button>
          <div style={{ flex: 1 }}>
            <SummaryRow jobs={jobs} bars={bars} staff={staff} year={year} />
          </div>
        </div>
      )}
      {!IS_MOBILE && <Legend jobs={jobs} today={TODAY} onEdit={(j) => window._openJobEdit(j)} customers={customers} />}
      {!IS_MOBILE && <div className="hint">セルをクリック → 工程登録　／　バー端をドラッグ → 期間変更　／　バー中央をドラッグ → 移動</div>}

      <div className="gantt-outer">
        <div className="gantt-header" ref={headerRef} onScroll={onHeaderScroll}>
          <GanttHeader days={days} memos={memos} today={TODAY} onMemoClick={(key,lbl) => window._openMemo(key,lbl)} />
        </div>
        <div className="gantt-main" ref={mainRef} onScroll={onMainScroll}>
          <GanttBody
            days={days} year={year} today={TODAY}
            jobs={jobs} staff={staff} cars={cars}
            bars={bars} carBars={carBars}
            setBars={setBars} setCarBars={setCarBars}
            onRefresh={fetchAll}
            readOnly={IS_MOBILE}
            memos={memos}
          />
        </div>
      </div>
      <Modals jobs={jobs} staff={staff} cars={cars} customers={customers} onRefresh={fetchAll} />
    </div>
  )
}
