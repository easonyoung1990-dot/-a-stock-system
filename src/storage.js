// ============================================================
// storage.js —— 数据层（localStorage 读写 + 默认方法论配置）
// ------------------------------------------------------------
// 设计原则：
//   1. 方法论内容（信号等级 / 自审清单 / 打分维度权重）全部放在这里
//      作为「默认值」，用户可在「配置」页随时增删改，绝不写死在组件里。
//   2. 所有读写都走这一层，组件不直接碰 localStorage，方便以后
//      换成后端数据库时只改这个文件。
// ============================================================

const CONFIG_KEY = 'astock_config_v1'
const RECORDS_KEY = 'astock_records_v1'
const WATCH_CONFIG_KEY = 'astock_watch_config_v1'
const WATCH_STATE_KEY = 'astock_watch_state_v1'
const WATCH_PREF_KEY = 'astock_watch_pref_v1'

// ---------- 默认方法论配置（用户可改）----------
export const DEFAULT_CONFIG = {
  // A/B/C 三级入场信号：每级有名称、说明、硬阈值
  signalLevels: [
    { id: 'A', name: 'A 级信号', threshold: '最强：主线+催化+资金三共振', desc: '满足全部硬条件，重仓级机会' },
    { id: 'B', name: 'B 级信号', threshold: '次强：两项达标', desc: '部分共振，标准仓位' },
    { id: 'C', name: 'C 级信号', threshold: '观察：单项达标', desc: '试探/轻仓或仅观察' },
  ],
  // 自审清单：开仓前逐项确认，防止冲动交易
  auditChecklist: [
    { id: 'c1', text: '是否符合当前主线方向？' },
    { id: 'c2', text: '是否有明确催化剂/事件驱动？' },
    { id: 'c3', text: '资金流向是否配合（量能/龙虎榜）？' },
    { id: 'c4', text: '是否设定了止损位与仓位上限？' },
    { id: 'c5', text: '是否在情绪冲动下做决定（冷静确认）？' },
  ],
  // 打分维度与权重：默认 历史结构30% + 催化/想象30% + 资金流行为40%
  scoreDimensions: [
    { id: 'd1', name: '历史结构', weight: 30 },
    { id: 'd2', name: '催化/想象空间', weight: 30 },
    { id: 'd3', name: '资金流行为', weight: 40 },
  ],
}

// ---------- 配置读写 ----------
export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return structuredClone(DEFAULT_CONFIG)
    const parsed = JSON.parse(raw)
    // 容错：缺字段时用默认补齐
    return {
      signalLevels: parsed.signalLevels ?? DEFAULT_CONFIG.signalLevels,
      auditChecklist: parsed.auditChecklist ?? DEFAULT_CONFIG.auditChecklist,
      scoreDimensions: parsed.scoreDimensions ?? DEFAULT_CONFIG.scoreDimensions,
    }
  } catch {
    return structuredClone(DEFAULT_CONFIG)
  }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

// ---------- 记录读写 ----------
export function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

// 生成一个简单唯一 id
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// 根据各维度得分(0-100)与权重，算综合分(0-100)
export function calcCompositeScore(scores, dimensions) {
  const totalWeight = dimensions.reduce((s, d) => s + Number(d.weight || 0), 0)
  if (totalWeight === 0) return 0
  const sum = dimensions.reduce((s, d) => {
    const v = Number(scores[d.id] ?? 0)
    return s + v * Number(d.weight || 0)
  }, 0)
  return Math.round((sum / totalWeight) * 10) / 10
}

// ============================================================
// 模块 2 —— 每日盯盘 checklist（7 个时间节点）+ 节点提醒
// ============================================================

// 默认 7 个盯盘时间节点（A 股交易时段），节点与清单项均可在「配置」页增删改
export const DEFAULT_WATCH_NODES = [
  { id: 'n1', time: '09:15', name: '集合竞价', items: [
    { id: 'w1', text: '查看竞价高开/低开个股与板块' },
    { id: 'w2', text: '关注昨日强势股竞价表现' },
  ] },
  { id: 'n2', time: '09:30', name: '开盘半小时', items: [
    { id: 'w3', text: '观察主线方向是否延续' },
    { id: 'w4', text: '留意放量异动与封板情况' },
  ] },
  { id: 'n3', time: '10:00', name: '第一波情绪', items: [
    { id: 'w5', text: '确认领涨板块与龙头' },
    { id: 'w6', text: '检查持仓是否符合预期，触发止损？' },
  ] },
  { id: 'n4', time: '11:20', name: '午盘小结', items: [
    { id: 'w7', text: '小结上午盘面强弱与资金流向' },
    { id: 'w8', text: '记录待午后观察的标的' },
  ] },
  { id: 'n5', time: '13:00', name: '午后开盘', items: [
    { id: 'w9', text: '观察午后承接力度' },
    { id: 'w10', text: '留意午后异动与情绪切换' },
  ] },
  { id: 'n6', time: '14:30', name: '尾盘布局', items: [
    { id: 'w11', text: '评估尾盘是否进场/减仓' },
    { id: 'w12', text: '检查明日预期与隔夜风险' },
  ] },
  { id: 'n7', time: '15:00', name: '收盘复盘', items: [
    { id: 'w13', text: '复盘当日操作得失' },
    { id: 'w14', text: '更新主线判断与次日计划' },
  ] },
]

// 今日日期 key，形如 2026-06-16
export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- 盯盘节点配置读写 ----------
export function loadWatchConfig() {
  try {
    const raw = localStorage.getItem(WATCH_CONFIG_KEY)
    if (!raw) return structuredClone(DEFAULT_WATCH_NODES)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : structuredClone(DEFAULT_WATCH_NODES)
  } catch {
    return structuredClone(DEFAULT_WATCH_NODES)
  }
}

export function saveWatchConfig(nodes) {
  localStorage.setItem(WATCH_CONFIG_KEY, JSON.stringify(nodes))
}

// ---------- 每日完成状态读写 ----------
// 结构：{ '2026-06-16': { 'nodeId:itemId': true, ... }, ... }
export function loadWatchState() {
  try {
    const raw = localStorage.getItem(WATCH_STATE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveWatchState(state) {
  localStorage.setItem(WATCH_STATE_KEY, JSON.stringify(state))
}

// ---------- 提醒偏好（是否开启浏览器通知）----------
export function loadWatchPref() {
  try {
    const raw = localStorage.getItem(WATCH_PREF_KEY)
    return raw ? JSON.parse(raw) : { remind: false }
  } catch {
    return { remind: false }
  }
}

export function saveWatchPref(pref) {
  localStorage.setItem(WATCH_PREF_KEY, JSON.stringify(pref))
}
