import { useState } from 'react'
import { loadWatchlist, saveWatchlist, genId } from '../storage'

function todayStr() {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 周${week}`
}

// 构造今日晨报提示词（复用方法论 §19.1 盘前模板 + 关注清单 + 联网指令）
function buildMorningPrompt(methodology, watchlist, dateStr) {
  return `今天是 ${dateStr}（北京时间）。你是我的 A 股超短交易 AI 大脑，请严格按我下面的《投资 AI 大脑决策系统》执行，并【联网搜集最新信息】，生成今日盘前晨报。

请输出：
1. 昨夜美股 / 海外市场与催化（英伟达、博通、美光、AI算力、半导体、能源、商品等）对 A 股的映射。
2. 今日最可能成为主线的 3 个方向，各给：催化是什么 + 影响评级（能否立马影响盘面：强 / 中 / 弱）。
3. 每个方向的核心龙头 / 趋势中军 / 补涨标的（给 A 股具体名称 + 代码）。
4. 重点新闻 / 事件清单，逐条标注"对今日盘面的影响评级"。
5. 我关注的 X 账号 / 信息源近期热点（见下方关注清单，尽力搜集；搜不到的请直接说明，不要编）。
6. 竞价需要重点验证的信号。
7. 10 万账户今日仓位上限 + 今日最不该追的情况。

要求：60% 给明确判断 + 40% 反面论证风险；只给能落到 A 股、能讲清逻辑的标的；拿不准的标"存疑"。

【我的关注清单】
${watchlist}

【交易方法论】
${methodology}`
}

// 每日晨报：一键生成提示词 → 发给 Claude（我会联网搜） → 把晨报贴回存档
export default function MorningReport({ methodology, reports, onSave, onDelete }) {
  const [watchlist, setWatchlist] = useState(loadWatchlist)
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(false)
  const [openId, setOpenId] = useState(null)

  function editWatchlist(text) {
    setWatchlist(text)
    saveWatchlist(text)
  }

  async function copyPrompt() {
    const text = buildMorningPrompt(methodology, watchlist, todayStr())
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('复制下面的晨报提示词，发给 Claude：', text)
    }
  }

  function save() {
    if (!reply.trim()) {
      alert('请先把 Claude 生成的晨报贴到下面，再存档')
      return
    }
    onSave({ id: genId(), date: todayStr(), content: reply.trim() })
    setReply('')
  }

  return (
    <div>
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <p className="muted" style={{ margin: 0 }}>
          📰 每日晨报 routine（当前手动版，用你的会员）：每天早上点「生成提示词」→ 发给 Claude（我会联网搜行业新闻/海外映射/催化）→ 把晨报贴回存档。
          接入大模型 + 定时后，可升级为每天 7 点自动生成、直接显示。
        </p>
      </div>

      <div className="card">
        <h2>① 关注清单（行业 / 题材 / X账号 / 标的池）</h2>
        <p className="muted">编辑后自动保存，会随晨报提示词一起发给 Claude。X 账号填你常看的。</p>
        <textarea value={watchlist} onChange={(e) => editWatchlist(e.target.value)} style={{ minHeight: 180 }} />
      </div>

      <div className="card">
        <h2>② 生成今日晨报提示词</h2>
        <p className="muted">{todayStr()} · 点下面复制（含方法论 + 关注清单 + 联网指令），发给 Claude。</p>
        <button className="btn" onClick={copyPrompt}>
          {copied ? '✅ 已复制！发给 Claude 让它联网出晨报' : '📋 复制今日晨报提示词'}
        </button>
      </div>

      <div className="card">
        <h2>③ 把 Claude 生成的晨报贴回 → 存档</h2>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)}
          placeholder="把 Claude 给出的今日晨报整段粘贴到这里…" style={{ minHeight: 140 }} />
        <button className="btn" onClick={save}>💾 存为今日晨报</button>
      </div>

      <div className="card">
        <h2>📅 历史晨报（{reports.length}）</h2>
        {reports.length === 0 && <p className="muted">还没有晨报存档。</p>}
        {reports.map((r) => (
          <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
            <div className="row-flex">
              <strong style={{ color: 'var(--gold)' }}>{r.date}</strong>
              <span className="spacer" />
              <button className="btn-sm" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                {openId === r.id ? '收起' : '查看'}
              </button>
              <button className="btn-sm" onClick={() => { if (confirm('删除这份晨报？')) onDelete(r.id) }}>删</button>
            </div>
            {openId === r.id && <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{r.content}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
