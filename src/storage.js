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
