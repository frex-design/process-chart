import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PHASES, ds } from '../lib/utils'
import DatePicker from './DatePicker'

export default function Modals({ jobs, staff, cars, onRefresh }) {
  const [modal, setModal] = useState(null) // {type, data}
  const [form, setForm] = useState({})
  const [memos, setMemos] = useState({})
  const [selectedPhase, setSelectedPhase] = useState('')

  // グローバル関数として公開
  useEffect(() => {
    window._openModal = (type) => { setForm({}); setSelectedPhase(''); setModal({ type, data: null }) }
    window._openNewBar = (data) => { setForm({ start: data.start, end: data.end, jobId: jobs[0]?.id }); setSelectedPhase(''); setModal({ type: 'newBar', data }) }
    window._openDriverBar = (data) => { setForm({ start: data.start, end: data.end, jobId: jobs[0]?.id }); setModal({ type: 'driverBar', data }) }
    window._openCarBar = (data) => { setForm({ start: data.start, end: data.end, jobId: jobs[0]?.id }); setModal({ type: 'carBar', data }) }
    window._openBarDetail = (bar) => { setForm({ jobId: bar.job_id, phase: bar.phase || '', start: bar.start_date, end: bar.end_date }); setModal({ type: 'barDetail', data: bar }) }
    window._openCarBarDetail = (bar) => { setForm({ jobId: bar.job_id, start: bar.start_date, end: bar.end_date }); setModal({ type: 'carBarDetail', data: bar }) }
    window._openJobEdit = (job) => { setForm({ name: job.name, contractStart: job.contract_start || '', contractEnd: job.contract_end || '', submitDate: job.submit_date || '' }); setModal({ type: 'jobEdit', data: job }) }
    window._openPersonEdit = (person, cat) => { setForm({ name: person.name }); setModal({ type: 'personEdit', data: { ...person, cat } }) }
    window._openCarEdit = (car) => { setForm({ name: car.name }); setModal({ type: 'carEdit', data: car }) }
    window._openMemo = (key, lbl) => { setForm({ content: window._memos?.[key] || '' }); setModal({ type: 'memo', data: { key, lbl } }) }
    return () => {
      delete window._openModal; delete window._openNewBar; delete window._openDriverBar
      delete window._openCarBar; delete window._openBarDetail; delete window._openCarBarDetail
      delete window._openJobEdit; delete window._openPersonEdit; delete window._openCarEdit; delete window._openMemo
    }
  }, [jobs, staff, cars])

  // メモをwindowに同期
  useEffect(() => { window._memos = memos }, [memos])

  function close() { setModal(null) }
  function f(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  // ============ 保存処理 ============
  async function saveNewBar() {
    if (!selectedPhase) { alert('工程を選択してください'); return }
    if (!form.start || !form.end) { alert('開始日・終了日を入力してください'); return }
    const year = new Date(form.start).getMonth() < 3 ? new Date(form.start).getFullYear() - 1 : new Date(form.start).getFullYear()
    await supabase.from('bars').insert({
      year, job_id: parseInt(form.jobId || jobs[0]?.id),
      phase: selectedPhase, staff_id: modal.data.staffId,
      start_date: form.start, end_date: form.end
    })
    onRefresh(); close()
  }

  async function saveDriverBar() {
    if (!form.start || !form.end) { alert('開始日・終了日を入力してください'); return }
    const year = new Date(form.start).getMonth() < 3 ? new Date(form.start).getFullYear() - 1 : new Date(form.start).getFullYear()
    await supabase.from('bars').insert({
      year, job_id: parseInt(form.jobId || jobs[0]?.id),
      phase: '', staff_id: modal.data.staffId,
      start_date: form.start, end_date: form.end
    })
    onRefresh(); close()
  }

  async function saveCarBar() {
    if (!form.start || !form.end) { alert('開始日・終了日を入力してください'); return }
    const year = new Date(form.start).getMonth() < 3 ? new Date(form.start).getFullYear() - 1 : new Date(form.start).getFullYear()
    await supabase.from('car_bars').insert({
      year, job_id: parseInt(form.jobId || jobs[0]?.id),
      car_id: modal.data.carId, start_date: form.start, end_date: form.end
    })
    onRefresh(); close()
  }

  async function saveBarDetail() {
    if (!form.start || !form.end) { alert('開始日・終了日を入力してください'); return }
    if (form.start > form.end) { alert('終了日は開始日以降にしてください'); return }
    await supabase.from('bars').update({
      job_id: parseInt(form.jobId),
      phase: form.phase || '',
      start_date: form.start,
      end_date: form.end
    }).eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function deleteBar() {
    if (!confirm('削除しますか？')) return
    await supabase.from('bars').delete().eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function saveCarBarDetail() {
    if (!form.start || !form.end) { alert('開始日・終了日を入力してください'); return }
    if (form.start > form.end) { alert('終了日は開始日以降にしてください'); return }
    await supabase.from('car_bars').update({
      job_id: parseInt(form.jobId),
      start_date: form.start,
      end_date: form.end
    }).eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function deleteCarBar() {
    if (!confirm('削除しますか？')) return
    await supabase.from('car_bars').delete().eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function saveJob() {
    if (!form.name) { alert('業務名を入力してください'); return }
    const payload = { name: form.name, contract_start: form.contractStart || null, contract_end: form.contractEnd || null, submit_date: form.submitDate || null }
    if (modal.type === 'jobEdit') {
      await supabase.from('jobs').update(payload).eq('id', modal.data.id)
    } else {
      await supabase.from('jobs').insert(payload)
    }
    onRefresh(); close()
  }

  async function deleteJob() {
    if (!confirm('業務を削除しますか？関連バーも削除されます。')) return
    await supabase.from('bars').delete().eq('job_id', modal.data.id)
    await supabase.from('car_bars').delete().eq('job_id', modal.data.id)
    await supabase.from('jobs').delete().eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function saveStaff() {
    if (!form.name) { alert('氏名を入力してください'); return }
    if (modal.type === 'personEdit') {
      await supabase.from('staff').update({ name: form.name }).eq('id', modal.data.id)
    } else {
      const cat = modal.data?.cat || 'staff'
      await supabase.from('staff').insert({ name: form.name, category: cat })
    }
    onRefresh(); close()
  }

  async function deleteStaff() {
    if (!confirm('削除しますか？関連バーも削除されます。')) return
    await supabase.from('bars').delete().eq('staff_id', modal.data.id)
    await supabase.from('staff').delete().eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function saveCar() {
    if (!form.name) { alert('車両名を入力してください'); return }
    if (modal.type === 'carEdit') {
      await supabase.from('cars').update({ name: form.name }).eq('id', modal.data.id)
    } else {
      await supabase.from('cars').insert({ name: form.name })
    }
    onRefresh(); close()
  }

  async function deleteCar() {
    if (!confirm('削除しますか？関連バーも削除されます。')) return
    await supabase.from('car_bars').delete().eq('car_id', modal.data.id)
    await supabase.from('cars').delete().eq('id', modal.data.id)
    onRefresh(); close()
  }

  async function saveMemo() {
    const key = modal.data.key
    const yr = parseInt(key.split('-')[0])
    if (form.content?.trim()) {
      await supabase.from('memos').upsert({ year: yr, month_key: key, content: form.content, updated_at: new Date().toISOString() }, { onConflict: 'year,month_key' })
      setMemos(prev => ({ ...prev, [key]: form.content }))
    } else {
      await supabase.from('memos').delete().match({ year: yr, month_key: key })
      setMemos(prev => { const n = { ...prev }; delete n[key]; return n })
    }
    close()
  }

  if (!modal) return null

  const { type, data } = modal
  const jobSelect = (key = 'jobId') => (
    <div className="form-row">
      <label className="form-label">業務</label>
      <select value={form[key] || jobs[0]?.id || ''} onChange={e => f(key, e.target.value)}>
        {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
      </select>
    </div>
  )

  const dateRange = (sk, ek) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
      <div><label className="form-label">開始日</label><DatePicker id={sk} value={form[sk]} onChange={v => f(sk, v)} /></div>
      <div><label className="form-label">終了日</label><DatePicker id={ek} value={form[ek]} onChange={v => f(ek, v)} /></div>
    </div>
  )

  return (
    <div className="modal-bg open" onClick={e => e.target.classList.contains('modal-bg') && close()}>
      <div className="modal">

        {/* 工程登録 */}
        {type === 'newBar' && <>
          <div className="modal-title">工程を登録</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>担当：{staff.find(s => s.id === data.staffId)?.name}</div>
          {jobSelect()}
          <div className="form-row">
            <label className="form-label">工程</label>
            <div className="phase-grid">
              {PHASES.map(ph => <div key={ph} className={'phase-opt' + (selectedPhase === ph ? ' selected' : '')} onClick={() => setSelectedPhase(ph)}>{ph}</div>)}
            </div>
          </div>
          {dateRange('start', 'end')}
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveNewBar}>登録</button>
          </div>
        </>}

        {/* 運転登録 */}
        {type === 'driverBar' && <>
          <div className="modal-title">運転を登録</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>担当：{staff.find(s => s.id === data.staffId)?.name}</div>
          {jobSelect()}
          {dateRange('start', 'end')}
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveDriverBar}>登録</button>
          </div>
        </>}

        {/* 配車登録 */}
        {type === 'carBar' && <>
          <div className="modal-title">配車を登録</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>車両：{cars.find(c => c.id === data.carId)?.name}</div>
          {jobSelect()}
          {dateRange('start', 'end')}
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveCarBar}>登録</button>
          </div>
        </>}

        {/* バー詳細・編集 */}
        {type === 'barDetail' && <>
          <div className="modal-title">
            {data.phase === '' ? '運転の編集' : data.phase && !data.phase.match(/準備計画|現地踏査|踏査まとめ|定期点検|損傷図作成|調書作成/) ? '補助の編集' : '工程の編集'}
          </div>
          {jobSelect()}
          {data.phase !== '' && (
            <div className="form-row">
              <label className="form-label">工程</label>
              <select value={form.phase || ''} onChange={e => f('phase', e.target.value)}>
                {PHASES.map(ph => <option key={ph}>{ph}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div><label className="form-label">開始日</label><DatePicker value={form.start} onChange={v => f('start', v)} /></div>
            <div><label className="form-label">終了日</label><DatePicker value={form.end} onChange={v => f('end', v)} /></div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={deleteBar} style={{ marginRight: 'auto' }}>削除</button>
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveBarDetail}>保存</button>
          </div>
        </>}

        {/* 配車バー詳細・編集 */}
        {type === 'carBarDetail' && <>
          <div className="modal-title">配車の編集</div>
          {jobSelect()}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div><label className="form-label">開始日</label><DatePicker value={form.start} onChange={v => f('start', v)} /></div>
            <div><label className="form-label">終了日</label><DatePicker value={form.end} onChange={v => f('end', v)} /></div>
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={deleteCarBar} style={{ marginRight: 'auto' }}>削除</button>
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveCarBarDetail}>保存</button>
          </div>
        </>}

        {/* 業務追加・編集 */}
        {(type === 'job' || type === 'jobEdit') && <>
          <div className="modal-title">{type === 'jobEdit' ? '業務を編集' : '業務を追加'}</div>
          <div className="form-row"><label className="form-label">業務名</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="form-row"><label className="form-label">契約工期（開始）</label><DatePicker value={form.contractStart} onChange={v => f('contractStart', v)} /></div>
          <div className="form-row"><label className="form-label">契約工期（終了）</label><DatePicker value={form.contractEnd} onChange={v => f('contractEnd', v)} /></div>
          <div className="form-row"><label className="form-label">提出日</label><DatePicker value={form.submitDate} onChange={v => f('submitDate', v)} /></div>
          <div className="modal-actions">
            {type === 'jobEdit' && <button className="btn btn-danger" onClick={deleteJob} style={{ marginRight: 'auto' }}>削除</button>}
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveJob}>保存</button>
          </div>
        </>}

        {/* 社員追加 */}
        {type === 'staff' && <>
          <div className="modal-title">社員を追加</div>
          <div className="form-row"><label className="form-label">氏名</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveStaff}>追加</button>
          </div>
        </>}

        {/* 協力会社追加 */}
        {type === 'partner' && <>
          <div className="modal-title">協力会社を追加</div>
          <div className="form-row"><label className="form-label">氏名・会社名</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="form-row">
            <label className="form-label">カテゴリ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['bossy','driver'].map(cat => (
                <div key={cat} className={'phase-opt' + (form.cat === cat ? ' selected' : '')} onClick={() => f('cat', cat)} style={{ flex: 1, textAlign: 'center' }}>
                  {cat === 'bossy' ? '補助' : '運転'}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={() => { modal.data = { cat: form.cat || 'bossy' }; saveStaff() }}>追加</button>
          </div>
        </>}

        {/* 社員編集 */}
        {type === 'personEdit' && <>
          <div className="modal-title">{data.cat === 'staff' ? '社員' : data.cat === 'bossy' ? '補助' : '運転'}を編集</div>
          <div className="form-row"><label className="form-label">氏名</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={deleteStaff} style={{ marginRight: 'auto' }}>削除</button>
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveStaff}>保存</button>
          </div>
        </>}

        {/* 社用車追加 */}
        {type === 'car' && <>
          <div className="modal-title">社用車を追加</div>
          <div className="form-row"><label className="form-label">車両名・ナンバー</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="modal-actions">
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveCar}>追加</button>
          </div>
        </>}

        {/* 車両編集 */}
        {type === 'carEdit' && <>
          <div className="modal-title">車両を編集</div>
          <div className="form-row"><label className="form-label">車両名・ナンバー</label><input value={form.name || ''} onChange={e => f('name', e.target.value)} /></div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={deleteCar} style={{ marginRight: 'auto' }}>削除</button>
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveCar}>保存</button>
          </div>
        </>}

        {/* メモ */}
        {type === 'memo' && <>
          <div className="modal-title">メモ — {data.lbl}</div>
          <div className="form-row">
            <textarea value={form.content || ''} onChange={e => f('content', e.target.value)} style={{ height: 120, width: '100%', fontSize: 13, padding: 8, border: '0.5px solid #ccc', borderRadius: 8, resize: 'vertical' }} placeholder="この月のメモを入力..." />
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={() => { f('content', ''); }} style={{ marginRight: 'auto' }}>クリア</button>
            <button className="btn" onClick={close}>キャンセル</button>
            <button className="btn btn-primary" onClick={saveMemo}>保存</button>
          </div>
        </>}

      </div>
    </div>
  )
}
