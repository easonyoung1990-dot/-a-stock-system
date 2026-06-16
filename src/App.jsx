import { useEffect, useState } from 'react'
import { loadConfig, saveConfig, loadRecords, saveRecords, loadWatchConfig, saveWatchConfig } from './storage'
import NewDecision from './components/NewDecision'
import RecordList from './components/RecordList'
import Stats from './components/Stats'
import DailyWatch from './components/DailyWatch'
import Config from './components/Config'

// 顶部标签页
const TABS = [
  { key: 'new', label: '📝 新建决策' },
  { key: 'list', label: '📋 记录看板' },
  { key: 'stats', label: '📊 命中率' },
  { key: 'watch', label: '⏰ 盯盘' },
  { key: 'config', label: '⚙️ 配置' },
]

export default function App() {
  const [tab, setTab] = useState('new')

  // 配置与记录是全局共享状态，统一在这里持有，子组件通过 props 读写
  const [config, setConfig] = useState(loadConfig)
  const [records, setRecords] = useState(loadRecords)
  const [watchNodes, setWatchNodes] = useState(loadWatchConfig)

  // 状态变化时自动持久化到 localStorage
  useEffect(() => { saveConfig(config) }, [config])
  useEffect(() => { saveRecords(records) }, [records])
  useEffect(() => { saveWatchConfig(watchNodes) }, [watchNodes])

  // 新增一条记录
  function addRecord(rec) {
    setRecords((prev) => [rec, ...prev])
    setTab('list') // 存完跳到看板，看到刚录入的记录
  }

  // 更新一条记录（用于事后回填结果）
  function updateRecord(id, patch) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  // 删除一条记录
  function deleteRecord(id) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div>
      <header style={{ marginBottom: 8 }}>
        <h1>📈 A股交易作战系统</h1>
        <p className="muted">模块 1 · 决策框架 + 信号录入 / 命中率追踪</p>
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

      {tab === 'new' && <NewDecision config={config} onSave={addRecord} />}
      {tab === 'list' && (
        <RecordList records={records} onUpdate={updateRecord} onDelete={deleteRecord} />
      )}
      {tab === 'stats' && <Stats records={records} config={config} />}
      {tab === 'watch' && <DailyWatch nodes={watchNodes} />}
      {tab === 'config' && (
        <Config
          config={config}
          onChange={setConfig}
          watchNodes={watchNodes}
          onWatchChange={setWatchNodes}
        />
      )}
    </div>
  )
}
