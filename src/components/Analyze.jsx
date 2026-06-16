import { useState } from 'react'

// 构造发给 Claude 的完整提示词（含用户方法论 + 待分析情报）
function buildPrompt(methodology, input) {
  const method = methodology.trim() || '（我还没有录入方法论，请基于通用的 A 股主线交易框架分析。）'
  return `你是我的 A 股交易分析助手。请严格依据我下面的【交易方法论】，对【待分析情报】做出判断，并按这个结构输出：

1. 是否属于当前主线（是 / 否 / 存疑）及理由
2. 买卖策略（买入 / 观望 / 卖出）
3. 建议仓位（几成）
4. 买入时点 / 卖出与止损时点
5. 逻辑支撑（对应我方法论里的哪几条）
6. 风险提示

如果情报里包含图片，我会在对话里直接把图片发给你。

【交易方法论】
${method}

【待分析情报】
${input.trim() || '（见我在对话里发送的图片/补充说明）'}`
}

// 分析页：自带 Claude 的「手动桥」——拼提示词 → 复制 → 发给 Claude → 把回复贴回存档
export default function Analyze({ methodology, onArchive }) {
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [reply, setReply] = useState('')
  const [copied, setCopied] = useState(false)
  const [hasImages, setHasImages] = useState(false)

  async function copyPrompt() {
    const text = buildPrompt(methodology, input)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // 某些浏览器不允许直接写剪贴板，退而求其次：选中文本
      window.prompt('复制下面的提示词，发给 Claude：', text)
    }
  }

  function save() {
    if (!reply.trim()) {
      alert('请先把 Claude 的分析结果贴到下面，再存档')
      return
    }
    onArchive({
      title: title.trim() || (input.trim().slice(0, 20) || '未命名分析'),
      input: input.trim(),
      hasImages,
      analysis: reply.trim(),
    })
    setInput(''); setTitle(''); setReply(''); setHasImages(false)
  }

  return (
    <div>
      <div className="card" style={{ borderColor: 'var(--accent)' }}>
        <p className="muted" style={{ margin: 0 }}>
          💡 当前为「自带 Claude」模式：免费，用你的会员。拼好提示词 → 发给 Claude → 把回复贴回存档。
          以后接入大模型可升级为 App 内一键自动分析。
        </p>
      </div>

      <div className="card">
        <h2>1️⃣ 贴入情报</h2>
        <label>标题（可选）</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="如：某群消息 / 某股异动" />
        <label>消息 / 文字情报</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="把别人发的消息、研报片段、你的观察贴在这里…" style={{ minHeight: 120 }} />
        <label className="row-flex" style={{ cursor: 'pointer', marginTop: 10 }}>
          <input type="checkbox" checked={hasImages} onChange={(e) => setHasImages(e.target.checked)}
            style={{ width: 18, height: 18 }} />
          <span>这条情报还包含图片（K线/截图）</span>
        </label>
        {hasImages && (
          <p className="muted">📷 图片不用上传到这里——复制提示词后，直接在和 Claude 的对话里把图片发给它即可。</p>
        )}
      </div>

      <div className="card">
        <h2>2️⃣ 生成提示词 → 发给 Claude</h2>
        <p className="muted">点下面按钮，提示词（含你「我的方法论」里的全部内容）会复制到剪贴板，粘贴给 Claude 即可。</p>
        <button className="btn" onClick={copyPrompt}>
          {copied ? '✅ 已复制！去粘贴给 Claude' : '📋 复制完整提示词'}
        </button>
        {!methodology.trim() && (
          <p className="muted" style={{ marginTop: 8 }}>
            ⚠️ 你还没录入方法论。去「🧠 我的方法论」填上你的买卖技术，分析会更贴合你。
          </p>
        )}
      </div>

      <div className="card">
        <h2>3️⃣ 把 Claude 的分析贴回来 → 存档</h2>
        <textarea value={reply} onChange={(e) => setReply(e.target.value)}
          placeholder="把 Claude 给出的分析结果整段粘贴到这里…" style={{ minHeight: 140 }} />
        <button className="btn" onClick={save}>💾 存入档案</button>
      </div>
    </div>
  )
}
