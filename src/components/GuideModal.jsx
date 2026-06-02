import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const APP_URL = 'https://frex-design.github.io/process-chart/'
const ICAL_BASE = 'https://rrsbyiypwgnwzqadwpky.supabase.co/functions/v1/frex-ical'

export default function GuideModal({ onClose, staff = [] }) {
  // 同期対象に出すのは社員のみ（協力・運転は除外）
  const staffOnly = staff.filter(s => s.category === 'staff')
  const [selectedIds, setSelectedIds] = useState([])
  const [copied, setCopied] = useState(false)

  const icalUrl = selectedIds.length
    ? `${ICAL_BASE}?staff_id=${selectedIds.join(',')}`
    : ICAL_BASE

  const toggleStaff = (id) => {
    setCopied(false)
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const copyUrl = () => {
    navigator.clipboard?.writeText(icalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)', position: 'relative'
      }}>
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            position: 'sticky', top: 0, float: 'right',
            background: 'none', border: 'none', fontSize: 22,
            cursor: 'pointer', color: '#888', lineHeight: 1
          }}
        >✕</button>

        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#1a1a1a' }}>
          📋 工程管理表 — 社員向け操作ガイド
        </h2>

        {/* QRコード */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          background: '#f5f8ff', borderRadius: 10, padding: '16px 20px',
          marginBottom: 24, border: '0.5px solid #d0e4f8'
        }}>
          <QRCodeSVG value={APP_URL} size={90} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>
              📱 スマホでアクセス
            </div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
              QRコードを読み取るとすぐに開けます
            </div>
            <div style={{ fontSize: 11, color: '#888', wordBreak: 'break-all' }}>
              {APP_URL}
            </div>
          </div>
        </div>

        <Section title="📱 スマホで使う場合">
          <p>ブラウザでURLを開くだけでOKです。</p>
          <p style={{ marginTop: 4 }}>Safariの場合「共有 → ホーム画面に追加」でアイコンが作れます。</p>
        </Section>

        <Section title="🎨 色の意味">
          <Table rows={[
            ['🟡 黄色の列', '今日'],
            ['🔵 青い列', '土曜日'],
            ['🟠 オレンジの列', '日曜日'],
            ['🟣 ピンクの列', '祝祭日'],
            ['🔴 赤背景・赤ドット', 'スケジュールが重複しています'],
          ]} />
        </Section>

        <Section title="✏️ 工程の登録方法">
          <Steps steps={[
            '自分の行の登録したい日付のセルをクリック（スマホはタップ）',
            '業務をリストから選ぶ',
            '工程を選ぶ（準備計画・現地踏査など）または自由記入',
            '開始日・終了日をカレンダーから選ぶ',
            '「登録」ボタンを押す',
          ]} />
        </Section>

        <Section title="🖊️ 工程の編集・削除">
          <Steps steps={[
            '編集したいバーをクリック（スマホはタップ）',
            '業務・工程・開始日・終了日を変更する',
            '「保存」または「削除」ボタンを押す',
          ]} />
        </Section>

        <Section title="🖱️ バーの移動・期間変更（PC限定）">
          <Table rows={[
            ['バー中央をドラッグ', '日付を移動する'],
            ['バー左端をドラッグ', '開始日を変更する'],
            ['バー右端をドラッグ', '終了日を変更する'],
            ['他の人の行にドラッグ', '担当者を変更する'],
          ]} />
        </Section>

        <Section title="🏖️ 有給休暇・その他の登録">
          <p>自分の行のセルをクリック → 業務で「<strong>有給休暇</strong>」または「<strong>その他</strong>」を選ぶ</p>
        </Section>

        <Section title="📋 工程を他の人にコピーする">
          <Steps steps={[
            '既存の工程バーをクリックして編集モーダルを開く',
            '画面下の「📋 他の人にコピー」ボタンをクリック',
            'コピーしたい社員をチェックボックスで選ぶ（複数選択可）',
            '「コピー実行（N名）」ボタンを押す',
          ]} />
          <p style={{ marginTop: 6, color: '#666' }}>
            同じ業務・工程・期間のバーが選択した全員に一括で登録されます。
          </p>
        </Section>

        <Section title="🔄 スケジュール管理ツールとの連携">
          <p style={{ marginBottom: 8 }}>
            スケジュール管理ツールで「<strong>休み</strong>」として登録すると、工程管理表に「<strong>有給休暇</strong>」バーが自動で追加されます。
          </p>
          <Table rows={[
            ['登録', 'スケジュールに「休み」を追加 → 工程表に有給休暇バーが自動追加'],
            ['変更', '日付を変更すると工程表のバーも自動更新'],
            ['削除', 'スケジュールから削除すると工程表のバーも自動削除'],
            ['対象外', '藤嶋・大里は同期対象外'],
          ]} />
          <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            ※ 手動で工程表に登録した有給休暇バーは対象外です
          </p>
        </Section>

        <Section title="📝 メモの使い方">
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
            <li>月のヘッダー（4月・5月…）をクリックするとメモを入力できます</li>
            <li>メモがある月は <strong>●</strong> マークが表示されます</li>
            <li>マウスを乗せるとメモの内容が表示されます</li>
          </ul>
        </Section>

        <Section title="📅 Googleカレンダーと連携する">
          <Steps steps={[
            'まず下で「同期したい社員」を選ぶ（選ばなければ全員ぶん）',
            'Googleカレンダー（calendar.google.com）を開く',
            '左メニューの「他のカレンダー」横の ＋ をクリック',
            '「URLで追加」を選択',
            '下のURLを貼り付けてカレンダーを追加',
          ]} />

          {/* 同期する社員を選択 */}
          <div style={{ marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#444' }}>
            👥 同期する社員を選ぶ
            <span style={{ fontWeight: 400, color: '#888', marginLeft: 6 }}>
              （何も選ばなければ全員）
            </span>
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px 8px',
            background: '#fafbfd', border: '0.5px solid #e0e0e0',
            borderRadius: 8, padding: '10px 12px'
          }}>
            {staffOnly.length === 0 && (
              <span style={{ fontSize: 12, color: '#aaa' }}>社員データを読み込み中…</span>
            )}
            {staffOnly.map(s => {
              const checked = selectedIds.includes(s.id)
              return (
                <label key={s.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
                  background: checked ? '#185FA5' : '#fff',
                  color: checked ? '#fff' : '#333',
                  border: `0.5px solid ${checked ? '#185FA5' : '#ccc'}`,
                  userSelect: 'none', transition: 'all 0.12s'
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStaff(s.id)}
                    style={{ display: 'none' }}
                  />
                  {checked ? '✓ ' : ''}{s.name}
                </label>
              )
            })}
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={() => { setSelectedIds([]); setCopied(false) }}
              style={{
                marginTop: 6, fontSize: 11, color: '#185FA5',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}
            >× 選択をクリア（全員に戻す）</button>
          )}

          {/* 生成されたURL */}
          <div style={{ marginTop: 10, fontSize: 11, color: '#666' }}>
            {selectedIds.length > 0
              ? `🔗 選択中 ${selectedIds.length} 名ぶんのURL`
              : '🔗 全員ぶんのURL'}
          </div>
          <div style={{
            background: '#f0f4ff', border: '0.5px solid #c0d0f0',
            borderRadius: 8, padding: '8px 12px', marginTop: 4,
            fontSize: 11, wordBreak: 'break-all', color: '#185FA5', fontFamily: 'monospace'
          }}>
            {icalUrl}
          </div>
          <button
            onClick={copyUrl}
            style={{
              marginTop: 8, background: copied ? '#2e9e5b' : '#185FA5', color: '#fff',
              border: 'none', borderRadius: 8, padding: '6px 18px',
              fontSize: 12, cursor: 'pointer', fontWeight: 500
            }}
          >{copied ? '✓ コピーしました' : '📋 URLをコピー'}</button>

          <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            ※ Googleカレンダーの同期は数時間に1回自動更新されます
          </p>
        </Section>

        <Section title="⚠️ 注意事項">
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8, color: '#555' }}>
            <li>データは自動で保存されます</li>
            <li>他の人の画面にもリアルタイムで反映されます</li>
            <li>削除したデータは元に戻せません</li>
          </ul>
        </Section>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              background: '#185FA5', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 32px', fontSize: 13,
              cursor: 'pointer', fontWeight: 500
            }}
          >閉じる</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#185FA5',
        borderBottom: '1.5px solid #e0ecf8', paddingBottom: 4, marginBottom: 10
      }}>{title}</div>
      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}

function Table({ rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {rows.map(([label, desc], i) => (
          <tr key={i} style={{ borderBottom: '0.5px solid #f0f0f0' }}>
            <td style={{ padding: '5px 8px', fontWeight: 500, whiteSpace: 'nowrap', width: '40%' }}>{label}</td>
            <td style={{ padding: '5px 8px', color: '#555' }}>{desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Steps({ steps }) {
  return (
    <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.9 }}>
      {steps.map((s, i) => <li key={i}>{s}</li>)}
    </ol>
  )
}
