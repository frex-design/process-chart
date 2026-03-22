export const PHASES = ['準備計画','現地踏査','踏査まとめ','定期点検','損傷図作成','調書作成']

export const JOB_COLORS = [
  '#2a5bbf','#e07b00','#1a8a5a','#7b52b8',
  '#b05a00','#0e7090','#b03070','#3a8a30','#6a3a9a','#c06000'
]

export const COL = 20 // px per day

export function ds(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function buildDays(year) {
  const days = []
  for (let d = new Date(year, 3, 1), e = new Date(year + 1, 3, 1); d < e; d.setDate(d.getDate() + 1))
    days.push(new Date(d))
  return days
}

export function jobColor(jobId, jobs) {
  const i = jobs.findIndex(x => x.id === jobId)
  const n = (i < 0 ? 0 : i) % JOB_COLORS.length
  return JOB_COLORS[n]
}

export function getHolidays(year) {
  const h = {}
  const add = (m, d, n) => { h[`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = n }
  add(1,1,'元日'); add(2,11,'建国記念日'); add(2,23,'天皇誕生日')
  add(3,20,'春分の日'); add(4,29,'昭和の日'); add(5,3,'憲法記念日')
  add(5,4,'みどりの日'); add(5,5,'こどもの日'); add(7,15,'海の日')
  add(8,11,'山の日'); add(9,16,'敬老の日'); add(9,23,'秋分の日')
  add(10,13,'スポーツの日'); add(11,3,'文化の日'); add(11,23,'勤労感謝の日')
  return h
}

export function overlap(a, b) {
  return a.start_date <= b.end_date && b.start_date <= a.end_date
}
