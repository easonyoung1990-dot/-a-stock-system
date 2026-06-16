import { useMemo, useState } from 'react'
import { genId, calcCompositeScore } from '../storage'

// 新建决策表单：选信号等级 → 自审清单打勾 → 三维打分 → 算综合分 → 保存
export default function NewDecision({ config, onSave }) {
  const { signalLevels, auditChecklist, scoreDimensions } = config

  const [stockName, setStockName] = useState('')
  const [theme, setTheme] = useState('')
  const [level, setLevel] = useState(signalLevels[0]?.id ?? '')
  const [checked, setChecked] = useState({}) // { 清单项id: true }
  const [scores, setScores] = useState({}) // { 维度id: 0-100 }
  const [note, setNote] = useState('')

  // 综合分实时计算
  const composite = useMemo(
    () => calcCompositeScore(scores, scoreDimensions),
    [scores, scoreDimensions],
  )

  const totalWeight = scoreDimensions.reduce((s, d) => s + Number(d.weight || 0), 0)
  const checkedCount = auditChecklist.filter((c) => checked[c.id]).length

  function toggleCheck(id) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function setScore(id, val) {
    setScores((prev) => ({ ...prev, [id]: Number(val) }))
  }

  function handleSave() {
    if (!stockName.trim()) {
      alert('请先填写标的名称/代码')
      return
    }
    const rec = {
      id: genId(),
      createdAt: new Date().toISOString(),
      stockName: stockName.trim(),
      theme: theme.trim(),
      level,
      // 保存当时的清单/维度快照（含文字），以后改了配置也不影响历史记录展示
      audit: auditChecklist.map((c) => ({ text: c.text, ok: !!checked[c.id] })),
      scores: scoreDimensions.map((d) => ({
        name: d.name,
        weight: d.weight,
        value: Number(scores[d.id] ?? 0),
      })),
      composite,
      note: note.trim(),
      result: 'pending', // pending | win | loss
      pnl: null, // 盈亏百分比
    }
    onSave(rec)
    // 重置表单
    setStockName(''); setTheme(''); setChecked({}); setScores({}); setNote('')
  }

  return (
    <div>
      <div className="card">
        <h2>1️⃣ 标的与主线</h2>
        <label>标的名称 / 代码</label>
        <input type="text" value={stockName} onChange={(e) => setStockName(e.target.value)}
          placeholder="如：贵州茅台 / 600519" />
        <label>候选主线</label>
        <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)}
          placeholder="如：AI 算力 / 低空经济" />
      </div>

      <div className="card">
        <h2>2️⃣ 信号等级</h2>
        {signalLevels.map((s) => (
          <label key={s.id} className="row-flex" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="radio" name="level" checked={level === s.id}
              onChange={() => setLevel(s.id)} style={{ width: 18, height: 18, marginTop: 3 }} />
            <span style={{ flex: 1 }}>
              <span className={`badge ${s.id}`}>{s.name}</span>
              <div className="muted">阈值：{s.threshold}</div>
              {s.desc && <div className="muted">{s.desc}</div>}
            </span>
          </label>
        ))}
      </div>

      <div className="card">
        <h2>3️⃣ 自审清单 <span className="muted">（{checkedCount}/{auditChecklist.length} 已确认）</span></h2>
        {auditChecklist.map((c) => (
          <div key={c.id} className="check-row">
            <input type="checkbox" checked={!!checked[c.id]} onChange={() => toggleCheck(c.id)} />
            <span>{c.text}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>4️⃣ 主线情景打分</h2>
        <p className="muted">每项 0–100 分，按权重加权得综合分（当前总权重 {totalWeight}%）</p>
        {scoreDimensions.map((d) => (
          <div key={d.id} className="score-row">
            <div className="score-head">
              <span>{d.name} <span className="muted">权重 {d.weight}%</span></span>
              <span className="score-val">{scores[d.id] ?? 0}</span>
            </div>
            <input type="range" min="0" max="100" value={scores[d.id] ?? 0}
              onChange={(e) => setScore(d.id, e.target.value)} />
          </div>
        ))}
        <hr />
        <div className="muted" style={{ textAlign: 'center' }}>综合得分</div>
        <div className="composite">{composite}</div>
      </div>

      <div className="card">
        <h2>5️⃣ 备注（可选）</h2>
        <textarea value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="本次决策的额外想法、风险点、计划仓位等" />
      </div>

      <button className="btn" onClick={handleSave}>💾 保存这条决策</button>
    </div>
  )
}
