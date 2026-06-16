import { useState } from 'react'

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const RESULT_LABEL = { pending: '待回填', win: '成功', loss: '失败' }

// 记录看板：列出所有历史记录，每条可展开查看明细 + 事后回填结果
export default function RecordList({ records, onUpdate, onDelete }) {
  const [openId, setOpenId] = useState(null)

  if (records.length === 0) {
    return <div className="empty">还没有记录。去「新建决策」录入第一条吧。</div>
  }

  return (
    <div>
      <p className="muted">共 {records.length} 条记录（最新在上）</p>
      {records.map((r) => (
        <div className="card" key={r.id}>
          <div className="row-flex">
            <span className={`badge ${r.level}`}>{r.level}</span>
            <strong>{r.stockName}</strong>
            <span className="spacer" />
            <span className={`result-tag ${r.result}`}>
              {RESULT_LABEL[r.result]}{r.result !== 'pending' && r.pnl != null ? ` ${r.pnl > 0 ? '+' : ''}${r.pnl}%` : ''}
            </span>
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            {r.theme ? `主线：${r.theme} · ` : ''}综合分 <strong style={{ color: 'var(--gold)' }}>{r.composite}</strong> · {fmtDate(r.createdAt)}
          </div>

          <div className="row-flex" style={{ marginTop: 10 }}>
            <button className="btn-sm" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
              {openId === r.id ? '收起明细' : '查看明细'}
            </button>
            <span className="spacer" />
            <button className="btn-sm" onClick={() => { if (confirm('确定删除这条记录？')) onDelete(r.id) }}>
              删除
            </button>
          </div>

          {openId === r.id && (
            <div style={{ marginTop: 12 }}>
              <hr />
              <h3>自审清单</h3>
              {r.audit?.map((a, i) => (
                <div key={i} className="muted">{a.ok ? '✅' : '⬜'} {a.text}</div>
              ))}
              <h3 style={{ marginTop: 10 }}>各维度打分</h3>
              {r.scores?.map((s, i) => (
                <div key={i} className="muted">{s.name}（{s.weight}%）：{s.value}</div>
              ))}
              {r.note && (<><h3 style={{ marginTop: 10 }}>备注</h3><p className="muted">{r.note}</p></>)}

              <hr />
              <h3>回填结果</h3>
              <div className="row-flex">
                <button className="btn-sm" style={r.result === 'win' ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
                  onClick={() => onUpdate(r.id, { result: 'win' })}>成功</button>
                <button className="btn-sm" style={r.result === 'loss' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
                  onClick={() => onUpdate(r.id, { result: 'loss' })}>失败</button>
                <button className="btn-sm" style={r.result === 'pending' ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                  onClick={() => onUpdate(r.id, { result: 'pending', pnl: null })}>重置为待定</button>
              </div>
              <label>盈亏百分比（%）</label>
              <input type="number" value={r.pnl ?? ''} placeholder="如 8.5 或 -3.2"
                onChange={(e) => onUpdate(r.id, { pnl: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
