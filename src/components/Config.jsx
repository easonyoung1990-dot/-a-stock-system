import { DEFAULT_CONFIG, genId } from '../storage'

// 方法论配置：信号等级 / 自审清单 / 打分维度权重，全部可增删改，不写死
export default function Config({ config, onChange }) {
  const totalWeight = config.scoreDimensions.reduce((s, d) => s + Number(d.weight || 0), 0)

  // —— 自审清单 ——
  function addCheck() {
    onChange({ ...config, auditChecklist: [...config.auditChecklist, { id: genId(), text: '' }] })
  }
  function editCheck(id, text) {
    onChange({ ...config, auditChecklist: config.auditChecklist.map((c) => c.id === id ? { ...c, text } : c) })
  }
  function delCheck(id) {
    onChange({ ...config, auditChecklist: config.auditChecklist.filter((c) => c.id !== id) })
  }

  // —— 打分维度 ——
  function addDim() {
    onChange({ ...config, scoreDimensions: [...config.scoreDimensions, { id: genId(), name: '', weight: 0 }] })
  }
  function editDim(id, patch) {
    onChange({ ...config, scoreDimensions: config.scoreDimensions.map((d) => d.id === id ? { ...d, ...patch } : d) })
  }
  function delDim(id) {
    onChange({ ...config, scoreDimensions: config.scoreDimensions.filter((d) => d.id !== id) })
  }

  // —— 信号等级 ——
  function editLevel(id, patch) {
    onChange({ ...config, signalLevels: config.signalLevels.map((l) => l.id === id ? { ...l, ...patch } : l) })
  }

  function resetAll() {
    if (confirm('确定恢复为默认方法论配置？你自定义的项会被覆盖（不影响已有记录）。')) {
      onChange(structuredClone(DEFAULT_CONFIG))
    }
  }

  return (
    <div>
      <p className="muted">这里的内容都是「你的方法论」，可自由增删改。修改即时保存，不影响已录入的历史记录。</p>

      <div className="card">
        <h2>信号等级（A/B/C）阈值</h2>
        {config.signalLevels.map((l) => (
          <div key={l.id} style={{ marginBottom: 12 }}>
            <div className="row-flex"><span className={`badge ${l.id}`}>{l.id}</span>
              <input type="text" value={l.name} onChange={(e) => editLevel(l.id, { name: e.target.value })} placeholder="等级名称" /></div>
            <input type="text" value={l.threshold} onChange={(e) => editLevel(l.id, { threshold: e.target.value })}
              placeholder="硬阈值描述" style={{ marginTop: 6 }} />
            <input type="text" value={l.desc} onChange={(e) => editLevel(l.id, { desc: e.target.value })}
              placeholder="说明（可选）" style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>

      <div className="card">
        <h2>自审清单</h2>
        {config.auditChecklist.map((c) => (
          <div key={c.id} className="row-flex" style={{ marginBottom: 8 }}>
            <input type="text" value={c.text} onChange={(e) => editCheck(c.id, e.target.value)} placeholder="清单项内容" />
            <button className="btn-sm" onClick={() => delCheck(c.id)}>删</button>
          </div>
        ))}
        <button className="btn secondary" onClick={addCheck}>＋ 新增清单项</button>
      </div>

      <div className="card">
        <h2>打分维度与权重 <span className="muted">（合计 {totalWeight}%）</span></h2>
        {totalWeight !== 100 && <p className="result-tag loss">⚠️ 当前权重合计不等于 100%，综合分会按比例归一化。</p>}
        {config.scoreDimensions.map((d) => (
          <div key={d.id} className="row-flex" style={{ marginBottom: 8 }}>
            <input type="text" value={d.name} onChange={(e) => editDim(d.id, { name: e.target.value })}
              placeholder="维度名称" style={{ flex: 1 }} />
            <input type="number" value={d.weight} onChange={(e) => editDim(d.id, { weight: Number(e.target.value) })}
              style={{ width: 80 }} /> <span>%</span>
            <button className="btn-sm" onClick={() => delDim(d.id)}>删</button>
          </div>
        ))}
        <button className="btn secondary" onClick={addDim}>＋ 新增打分维度</button>
      </div>

      <button className="btn danger" onClick={resetAll}>↺ 恢复默认配置</button>
    </div>
  )
}
