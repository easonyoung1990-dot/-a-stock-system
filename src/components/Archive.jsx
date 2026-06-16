import { useState } from 'react'

function fmtDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 分析档案：每一次分析的情报 + Claude 的结论都沉淀在这里
export default function Archive({ items, onDelete }) {
  const [openId, setOpenId] = useState(null)

  if (items.length === 0) {
    return <div className="empty">还没有存档。去「🤖 分析」做第一条分析并存进来吧。</div>
  }

  return (
    <div>
      <p className="muted">共 {items.length} 条分析存档（最新在上）</p>
      {items.map((r) => (
        <div className="card" key={r.id}>
          <div className="row-flex">
            <strong>{r.title}</strong>
            {r.hasImages && <span className="badge C">含图</span>}
            <span className="spacer" />
            <button className="btn-sm" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
              {openId === r.id ? '收起' : '展开'}
            </button>
            <button className="btn-sm" onClick={() => { if (confirm('删除这条存档？')) onDelete(r.id) }}>删除</button>
          </div>
          <div className="muted" style={{ marginTop: 4 }}>{fmtDate(r.createdAt)}</div>

          {openId === r.id && (
            <div style={{ marginTop: 10 }}>
              {r.input && (<>
                <h3>情报原文</h3>
                <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>{r.input}</p>
              </>)}
              <hr />
              <h3>Claude 分析结论</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{r.analysis}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
