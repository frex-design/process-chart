export const PHASES = ['準備計画','現地踏査','踏査まとめ','定期点検','損傷図作成','調書作成']

// 業務バーの色パレット（13色・視認性優先）
// - バー文字は白固定のため、白文字が読める暗さの色のみ採用
// - 暗い暖色（茶・金・ラスト）は"こげ茶"に潰れて見分けにくいので廃止し、
//   暖色はオレンジ系2つだけに限定。寒色・緑・ピンク側に色相を散らす
// - 固定色（有給=#e03030 / その他=#7b52b8）とは重複しない
// - 番号順で隣り合う業務が同系色にならないようジグザグ配置
export const JOB_COLORS = [
  '#2a5bbf', // ① ロイヤルブルー
  '#e07b00', // ② オレンジ（暖色1）
  '#1a8a5a', // ③ エメラルドグリーン
  '#c0398f', // ④ マゼンタ
  '#0e8fa0', // ⑤ シアン
  '#6b8e23', // ⑥ オリーブ（黄緑）
  '#3f51b5', // ⑦ インディゴ
  '#c2185b', // ⑧ ローズ
  '#00897b', // ⑨ ティール
  '#d15a00', // ⑩ パンプキン（暖色2）
  '#2e7d32', // ⑪ フォレストグリーン
  '#0277bd', // ⑫ スカイブルー
  '#ad1457'  // ⑬ ダークローズ
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

export const FIXED_JOB_COLORS = {
  '有給休暇': '#e03030',
  'その他': '#7b52b8'
}

// 業務名の先頭番号（例: "001.秋田南部" → 1）を返す。番号なしは Infinity（末尾へ）
export function jobNum(name) {
  const m = String(name || '').match(/^\s*0*(\d+)/)
  return m ? parseInt(m[1], 10) : Infinity
}

// 色を割り当てる対象（固定色を除く）を業務名の番号順に並べたリスト
export function orderedColorableJobs(jobs) {
  return jobs
    .filter(j => !FIXED_JOB_COLORS[j.name])
    .slice()
    .sort((a, b) => {
      const na = jobNum(a.name), nb = jobNum(b.name)
      if (na !== nb) return na - nb
      return String(a.name || '').localeCompare(String(b.name || ''), 'ja')
    })
}

export function jobColor(jobId, jobs) {
  const job = jobs.find(x => x.id === jobId)
  if (job && FIXED_JOB_COLORS[job.name]) return FIXED_JOB_COLORS[job.name]
  // 番号順のindexで色を割り当て → 表示中の業務が同じ色にならない
  const ordered = orderedColorableJobs(jobs)
  const i = ordered.findIndex(x => x.id === jobId)
  const n = (i < 0 ? 0 : i) % JOB_COLORS.length
  return JOB_COLORS[n]
}

// 第n月曜日の「日」を返す（ハッピーマンデー用）
function nthMonday(year, month, n) {
  const firstDow = new Date(year, month - 1, 1).getDay() // 0=日
  const offset = (8 - firstDow) % 7 // 1日から最初の月曜までの日数
  return 1 + offset + (n - 1) * 7
}

// 春分の日・秋分の日（天文近似式・1980〜2099年で有効）
function vernalEquinox(year) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}
function autumnalEquinox(year) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
}

// 指定年の国民の祝日・休日を { 'YYYY-MM-DD': '祝日名' } で返す
// 対応: 日付固定・ハッピーマンデー・春分秋分・振替休日・国民の休日
export function getHolidays(year) {
  const pad = n => String(n).padStart(2, '0')
  const key = (m, d) => `${year}-${pad(m)}-${pad(d)}`
  const h = {}

  // ① 日付が固定の祝日
  h[key(1, 1)]   = '元日'
  h[key(2, 11)]  = '建国記念の日'
  h[key(2, 23)]  = '天皇誕生日'
  h[key(4, 29)]  = '昭和の日'
  h[key(5, 3)]   = '憲法記念日'
  h[key(5, 4)]   = 'みどりの日'
  h[key(5, 5)]   = 'こどもの日'
  h[key(8, 11)]  = '山の日'
  h[key(11, 3)]  = '文化の日'
  h[key(11, 23)] = '勤労感謝の日'

  // ② ハッピーマンデー（第n月曜日）
  h[key(1, nthMonday(year, 1, 2))]   = '成人の日'      // 1月第2月曜
  h[key(7, nthMonday(year, 7, 3))]   = '海の日'        // 7月第3月曜
  h[key(9, nthMonday(year, 9, 3))]   = '敬老の日'      // 9月第3月曜
  h[key(10, nthMonday(year, 10, 2))] = 'スポーツの日'  // 10月第2月曜

  // ③ 春分の日・秋分の日（年によって変動）
  h[key(3, vernalEquinox(year))]   = '春分の日'
  h[key(9, autumnalEquinox(year))] = '秋分の日'

  // ④ 国民の休日（前後の日が両方とも祝日の平日）※振替より先に確定
  const base = { ...h }
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue // 日曜は対象外
    const today = ds(d)
    if (base[today]) continue // 既に祝日
    const prev = new Date(d); prev.setDate(prev.getDate() - 1)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    if (base[ds(prev)] && base[ds(next)]) h[today] = '国民の休日'
  }

  // ⑤ 振替休日（祝日が日曜 → 次の祝日でない日）
  for (const dateStr of Object.keys({ ...h })) {
    const dt = new Date(dateStr + 'T00:00:00')
    if (dt.getDay() !== 0) continue // 日曜の祝日のみ
    const sub = new Date(dt)
    do { sub.setDate(sub.getDate() + 1) } while (h[ds(sub)])
    if (sub.getFullYear() === year) h[ds(sub)] = '振替休日'
  }

  return h
}

export function overlap(a, b) {
  return a.start_date <= b.end_date && b.start_date <= a.end_date
}
