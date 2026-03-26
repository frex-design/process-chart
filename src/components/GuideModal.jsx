import { QRCodeSVG } from 'qrcode.react'

const APP_URL = 'https://frex-design.github.io/process-chart/'

export default function GuideModal({ onClose }) {
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

        <Section title="📝 メモの使い方">
          <ul style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
            <li>月のヘッダー（4月・5月…）をクリックするとメモを入力できます</li>
            <li>メモがある月は <strong>●</strong> マークが表示されます</li>
            <li>マウスを乗せるとメモの内容が表示されます</li>
          </ul>
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
