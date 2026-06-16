// 命中率统计：按信号等级汇总数量、已结算数、命中率、平均盈亏
export default function Stats({ records, config }) {
  const levels = config.signalLevels

  // 按等级聚合
  const stats = levels.map((lv) => {
    const all = records.filter((r) => r.level === lv.id)
    const settled = all.filter((r) => r.result === 'win' || r.result === 'loss')
    const wins = settled.filter((r) => r.result === 'win')
    const winRate = settled.length ? Math.round((wins.length / settled.length) * 100) : 0
    const pnls = settled.map((r) => Number(r.pnl ?? 0)).filter((n) => !Number.isNaN(n))
    const avgPnl = pnls.length ? Math.round((pnls.reduce((a, b) => a + b, 0) / pnls.length) * 10) / 10 : 0
    return { lv, total: all.length, settled: settled.length, wins: wins.length, winRate, avgPnl }
  })

  const totalAll = records.length
  const totalSettled = records.filter((r) => r.result !== 'pending').length

  if (totalAll === 0) {
    return <div className="empty">还没有记录，统计为空。</div>
  }

  return (
    <div>
      <div className="card">
        <h2>总览</h2>
        <p className="muted">总记录 {totalAll} 条 · 已结算 {totalSettled} 条 · 待回填 {totalAll - totalSettled} 条</p>
      </div>

      {stats.map(({ lv, total, settled, wins, winRate, avgPnl }) => (
        <div className="card" key={lv.id}>
          <div className="row-flex">
            <span className={`badge ${lv.id}`}>{lv.name}</span>
            <span className="spacer" />
            <span className="muted">{total} 条 · 已结算 {settled} 条</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${winRate}%` }}>
              {settled > 0 ? `命中率 ${winRate}%` : ''}
            </div>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            命中 {wins}/{settled} · 平均盈亏 <strong style={{ color: avgPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{avgPnl > 0 ? '+' : ''}{avgPnl}%</strong>
          </p>
        </div>
      ))}
      <p className="muted" style={{ textAlign: 'center' }}>命中率 = 成功数 ÷ 已结算数（待回填的不计入）</p>
    </div>
  )
}
