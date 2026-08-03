export const PHASES = ['準備計画','現地踏査','踏査まとめ','定期点検','損傷図作成','調書作成']

// 現場工程（バーを点滅表示する対象）
export const PULSE_PHASES = ['現地踏査', '定期点検']

// 自由記入と工程の合成セパレータ（「自由記入ー工程名」表記）
export const PHASE_SEP = 'ー'

// 自由記入(free)とプリセット工程(preset)を1つの phase 文字列に合成
export function combinePhase(free, preset) {
  const f = (free || '').trim()
  const p = preset || ''
  if (f && p) return `${f}${PHASE_SEP}${p}`
  return f || p || ''
}

// 保存済みの phase 文字列を { free, preset } に分解
export function splitPhase(phase) {
  const s = (phase || '').trim()
  if (!s) return { free: '', preset: '' }
  if (PHASES.includes(s)) return { free: '', preset: s }        // プリセットのみ
  for (const p of PHASES) {                                      // 「自由記入ー工程」形式
    if (s.endsWith(PHASE_SEP + p)) {
      return { free: s.slice(0, s.length - (PHASE_SEP + p).length), preset: p }
    }
  }
  return { free: s, preset: '' }                                 // 自由記入のみ
}

// この phase が現場工程を含むか（点滅対象か）
export function isPulsePhase(phase) {
  return PULSE_PHASES.includes(splitPhase(phase).preset)
}

// 業務バーの色パレット（14色・視認性＆メリハリ優先）
// - バー文字は輝度で黒/白を自動切替（textColorFor）するため、
//   黄色・ゴールド・ライム等の明るい暖色も使用可能
// - 暖色（橙・黄・金・ライム・ラスト）と寒色・緑・ピンクをバランス良く配置
// - 固定色（有給=#e03030 / その他=#7b52b8）とは重複しない
// - 番号順で隣り合う業務が同系色にならないようジグザグ配置
export const JOB_COLORS = [
  '#2a5bbf', // ① ロイヤルブルー
  '#e8590c', // ② オレンジ（暖）
  '#2f9e44', // ③ グリーン
  '#d6336c', // ④ ローズ
  '#f5b800', // ⑤ イエロー（暖・黒文字）
  '#1098ad', // ⑥ シアン
  '#f08c00', // ⑦ アンバー（暖・赤みを抜いた明るい橙／有給の赤と区別）
  '#4263eb', // ⑧ インディゴ
  '#82c91e', // ⑨ ライム（暖・黒文字）
  '#e64980', // ⑩ ピンク
  '#0ca678', // ⑪ ティール
  '#e8a90c', // ⑫ ゴールド（暖・黒文字）
  '#1864ab', // ⑬ 濃紺
  '#a61e4d'  // ⑭ ダークローズ
]

// 背景色の輝度から、読みやすい文字色（黒 or 白）を返す
export function textColorFor(bg) {
  const hex = String(bg || '').replace('#', '')
  if (hex.length !== 6) return '#fff'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 // sRGB近似輝度
  return lum > 0.6 ? '#1a1a1a' : '#fff'
}

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
  'その他': '#7b52b8',
  '復建(本社)トンネル': '#f2cf63'  // 専用の薄めゴールド（CEO指定）
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
