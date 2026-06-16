import { METHODOLOGY_PLACEHOLDER } from '../storage'

// 我的方法论：一整套买卖技术，是 AI 分析的「大脑」（将来作为大模型系统提示词）
export default function Methodology({ value, onChange }) {
  const chars = value.length

  return (
    <div>
      <div className="card" style={{ borderColor: 'var(--gold)' }}>
        <p className="muted" style={{ margin: 0 }}>
          🧠 这是 AI 的「大脑」。你在这里录入的整套买卖技术，会随每次分析一起发给 Claude，
          让它<strong>按你的方法、而不是泛泛而谈</strong>来判断。越详细越好。内容只存在你本地浏览器。
        </p>
      </div>

      <div className="card">
        <div className="row-flex">
          <h2 style={{ margin: 0 }}>我的交易方法论</h2>
          <span className="spacer" />
          <span className="muted">{chars} 字 · 自动保存</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={METHODOLOGY_PLACEHOLDER}
          style={{ minHeight: 360 }}
        />
      </div>
    </div>
  )
}
