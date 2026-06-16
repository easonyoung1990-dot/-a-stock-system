import { useEffect, useState } from 'react'
import { loadMethodology, saveMethodology, loadArchive, saveArchive, genId } from './storage'
import Analyze from './components/Analyze'
import Archive from './components/Archive'
import Methodology from './components/Methodology'

// 精简后的三个标签页：分析 / 档案 / 我的方法论
const TABS = [
  { key: 'analyze', label: '🤖 分析' },
  { key: 'archive', label: '🗂 档案' },
  { key: 'method', label: '🧠 我的方法论' },
]

export default function App() {
  const [tab, setTab] = useState('analyze')

  // 「我的方法论」=未来大模型的大脑；分析档案=历史记录
  const [methodology, setMethodology] = useState(loadMethodology)
  const [archive, setArchive] = useState(loadArchive)

  useEffect(() => { saveMethodology(methodology) }, [methodology])
  useEffect(() => { saveArchive(archive) }, [archive])

  function addToArchive(report) {
    const item = { id: genId(), createdAt: new Date().toISOString(), ...report }
    setArchive((prev) => [item, ...prev])
    setTab('archive')
  }

  function deleteArchive(id) {
    setArchive((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <header style={{ marginBottom: 8 }}>
        <h1>📈 A股交易作战系统</h1>
        <p className="muted">AI 投研助手 · 喂给它消息/图/文档 → 出主线判断与买卖策略</p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'analyze' && <Analyze methodology={methodology} onArchive={addToArchive} />}
      {tab === 'archive' && <Archive items={archive} onDelete={deleteArchive} />}
      {tab === 'method' && <Methodology value={methodology} onChange={setMethodology} />}
    </div>
  )
}
