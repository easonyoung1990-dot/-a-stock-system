import { useEffect, useMemo, useRef, useState } from 'react'
import { loadWatchState, saveWatchState, loadWatchPref, saveWatchPref, todayKey } from '../storage'

// 把 "HH:MM" 转成当天的分钟数，方便比较先后
function toMin(t) {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + m
}
function nowHM() {
  const d = new Date()
  return { hm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, min: d.getHours() * 60 + d.getMinutes() }
}

// 每日盯盘看板：按时间顺序走 7 个节点，逐项打勾；进度按日期记录；到点浏览器提醒
export default function DailyWatch({ nodes }) {
  const date = todayKey()
  const [clock, setClock] = useState(() => new Date())
  const [state, setState] = useState(loadWatchState) // { 'YYYY-MM-DD': { 'nodeId:itemId': true } }
  const [pref, setPref] = useState(loadWatchPref)     // { remind: bool }
  const [openId, setOpenId] = useState(null)
  const firedRef = useRef(new Set())                  // 已提醒过的 `${date}:${nodeId}`，防重复

  const today = state[date] || {}

  // 每秒走一次时钟（平滑显示秒 + 更新高亮 + 触发到点提醒检查）
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 持久化每日状态
  useEffect(() => { saveWatchState(state) }, [state])

  // 节点排序（按时间先后）
  const sorted = useMemo(() => [...nodes].sort((a, b) => toMin(a.time) - toMin(b.time)), [nodes])

  // 当前/下一个节点
  const { min: nowMin } = nowHM()
  const passed = sorted.filter((n) => toMin(n.time) <= nowMin)
  const currentNode = passed[passed.length - 1] || null
  const nextNode = sorted.find((n) => toMin(n.time) > nowMin) || null

  // 到点提醒：时钟每跳一次就检查一遍
  useEffect(() => {
    if (!pref.remind) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const { hm } = nowHM()
    for (const n of sorted) {
      const key = `${date}:${n.id}`
      if (n.time === hm && !firedRef.current.has(key)) {
        firedRef.current.add(key)
        new Notification('📈 盯盘提醒', { body: `到点了：${n.time} ${n.name}` })
      }
    }
  }, [clock, pref.remind, sorted, date])

  function toggleItem(nodeId, itemId) {
    const k = `${nodeId}:${itemId}`
    setState((prev) => {
      const day = { ...(prev[date] || {}) }
      if (day[k]) delete day[k]; else day[k] = true
      return { ...prev, [date]: day }
    })
  }

  function resetToday() {
    if (confirm('清空今日所有打勾？')) {
      setState((prev) => ({ ...prev, [date]: {} }))
    }
  }

  async function toggleRemind() {
    if (pref.remind) {
      const next = { ...pref, remind: false }
      setPref(next); saveWatchPref(next)
      return
    }
    if (typeof Notification === 'undefined') {
      alert('当前浏览器不支持通知功能')
      return
    }
    let perm = Notification.permission
    if (perm === 'default') perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      alert('未授予通知权限，无法开启到点提醒。请在浏览器站点设置里允许通知。')
      return
    }
    const next = { ...pref, remind: true }
    setPref(next); saveWatchPref(next)
    new Notification('📈 盯盘提醒已开启', { body: '到达每个节点时间时会提醒你。' })
  }

  function nodeStatus(n) {
    if (currentNode && n.id === currentNode.id) return { tag: '进行中', color: 'var(--green)' }
    if (toMin(n.time) <= nowMin) return { tag: '已过', color: 'var(--muted)' }
    return { tag: '未到', color: 'var(--accent)' }
  }

  const clockStr = `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}:${String(clock.getSeconds()).padStart(2, '0')}`

  return (
    <div>
      <div className="card">
        <div className="row-flex">
          <h2 style={{ margin: 0 }}>⏰ {clockStr}</h2>
          <span className="spacer" />
          <span className="muted">{date}</span>
        </div>
        <p className="muted" style={{ marginTop: 6 }}>
          {currentNode ? `当前节点：${currentNode.time} ${currentNode.name}` : '尚未到第一个节点'}
          {nextNode ? ` · 下一个：${nextNode.time} ${nextNode.name}` : ' · 今日节点已走完'}
        </p>
        <div className="row-flex" style={{ marginTop: 8 }}>
          <button className="btn-sm" onClick={toggleRemind}
            style={pref.remind ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}>
            {pref.remind ? '🔔 提醒已开启' : '🔕 开启到点提醒'}
          </button>
          <span className="spacer" />
          <button className="btn-sm" onClick={resetToday}>清空今日</button>
        </div>
      </div>

      {sorted.map((n) => {
        const st = nodeStatus(n)
        const done = n.items.filter((it) => today[`${n.id}:${it.id}`]).length
        const isCurrent = currentNode && n.id === currentNode.id
        return (
          <div className="card" key={n.id}
            style={isCurrent ? { borderColor: 'var(--green)' } : {}}>
            <div className="row-flex" onClick={() => setOpenId(openId === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
              <strong style={{ color: 'var(--gold)' }}>{n.time}</strong>
              <span>{n.name}</span>
              <span className="spacer" />
              <span className="muted">{done}/{n.items.length}</span>
              <span className="result-tag" style={{ color: st.color, fontSize: 13 }}>{st.tag}</span>
            </div>

            {openId === n.id && (
              <div style={{ marginTop: 10 }}>
                {n.items.length === 0 && <p className="muted">该节点暂无清单项，可在「配置」页添加。</p>}
                {n.items.map((it) => {
                  const checked = !!today[`${n.id}:${it.id}`]
                  return (
                    <div key={it.id} className="check-row" onClick={() => toggleItem(n.id, it.id)} style={{ cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} readOnly />
                      <span style={checked ? { color: 'var(--muted)', textDecoration: 'line-through' } : {}}>{it.text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <p className="muted" style={{ textAlign: 'center' }}>
        进度按日期记录，第二天自动从零开始。提醒依赖浏览器通知权限，需保持页面打开。
      </p>
    </div>
  )
}
