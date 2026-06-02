import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function formatDate(dateStr: string): string {
  return dateStr.replace(/-/g, '') + 'T000000Z'
}

function formatDateEnd(dateStr: string): string {
  // 終了日の翌日（iCalは終了日が排他的）
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}T000000Z`
}

function escapeIcal(str: string): string {
  return (str || '').replace(/[\\;,]/g, c => '\\' + c).replace(/\n/g, '\\n')
}

Deno.serve(async (req) => {
  // CORSヘッダー
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    })
  }

  // ── 社員フィルタ ──────────────────────────────
  // ?staff_id=7        → 堀井 博之の工程だけ
  // ?staff_id=7,8      → 複数選択（カンマ区切り）
  // 指定なし           → 全件（従来どおり・配車バーも含む）
  const url = new URL(req.url)
  const staffParam = url.searchParams.get('staff_id')
  const staffIdFilter = staffParam
    ? staffParam.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : null
  const hasFilter = !!(staffIdFilter && staffIdFilter.length)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // データ取得
  const [barsRes, staffRes, jobsRes, carBarsRes, carsRes] = await Promise.all([
    supabase.from('bars').select('*'),
    supabase.from('staff').select('*'),
    supabase.from('jobs').select('*'),
    supabase.from('car_bars').select('*'),
    supabase.from('cars').select('*'),
  ])

  const bars = barsRes.data || []
  const staff = staffRes.data || []
  const jobs = jobsRes.data || []
  const carBars = carBarsRes.data || []
  const cars = carsRes.data || []

  // カレンダー名（フィルタ時は対象社員名を付与）
  let calName = 'FRex Design 工程管理表'
  if (hasFilter) {
    const names = staffIdFilter!
      .map((id: number) => staff.find((s: any) => s.id === id)?.name)
      .filter((n: any): n is string => !!n)
    if (names.length) calName += ` — ${names.join('・')}`
  }

  const events: string[] = []

  // 社員バー（フィルタ指定時は対象社員のみ）
  const targetBars = hasFilter
    ? bars.filter((bar: any) => staffIdFilter!.includes(bar.staff_id))
    : bars

  for (const bar of targetBars) {
    const person = staff.find((s: any) => s.id === bar.staff_id)
    const job = jobs.find((j: any) => j.id === bar.job_id)
    const personName = person?.name || '不明'
    const jobName = job?.name || '不明'
    const phase = bar.phase || ''
    const summary = phase ? `${phase} / ${jobName}（${personName}）` : `${jobName}（${personName}）`

    events.push([
      'BEGIN:VEVENT',
      `UID:bar-${bar.id}@frex-design`,
      `DTSTART;VALUE=DATE:${bar.start_date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${new Date(new Date(bar.end_date).getTime() + 86400000).toISOString().slice(0,10).replace(/-/g,'')}`,
      `SUMMARY:${escapeIcal(summary)}`,
      `DESCRIPTION:${escapeIcal(`担当：${personName}\n業務：${jobName}${phase ? '\n工程：' + phase : ''}`)}`,
      'END:VEVENT',
    ].join('\r\n'))
  }

  // 配車バー（社員フィルタ指定時は出さない／全体表示時のみ）
  if (!hasFilter) {
    for (const bar of carBars) {
      const car = cars.find((c: any) => c.id === bar.car_id)
      const job = jobs.find((j: any) => j.id === bar.job_id)
      const carName = car?.name || '不明'
      const jobName = job?.name || '不明'
      const phase = bar.phase || ''
      const summary = phase ? `【配車】${phase} / ${jobName}（${carName}）` : `【配車】${jobName}（${carName}）`

      events.push([
        'BEGIN:VEVENT',
        `UID:carbar-${bar.id}@frex-design`,
        `DTSTART;VALUE=DATE:${bar.start_date.replace(/-/g, '')}`,
        `DTEND;VALUE=DATE:${new Date(new Date(bar.end_date).getTime() + 86400000).toISOString().slice(0,10).replace(/-/g,'')}`,
        `SUMMARY:${escapeIcal(summary)}`,
        `DESCRIPTION:${escapeIcal(`車両：${carName}\n業務：${jobName}${phase ? '\n工程：' + phase : ''}`)}`,
        'END:VEVENT',
      ].join('\r\n'))
    }
  }

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FRex Design//工程管理表//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(calName)}`,
    'X-WR-TIMEZONE:Asia/Tokyo',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new Response(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    }
  })
})
