/**
 * 搜索相关常量
 * @description 集中管理搜索功能中的硬编码值
 */

// ============ 搜索模式 ============
export type SearchMode = 'normal' | 'semantic' | 'image'

export const SEARCH_MODE = {
  NORMAL: 'normal' as const,
  SEMANTIC: 'semantic' as const,
  IMAGE: 'image' as const,
}

export const SEARCH_MODE_OPTIONS = [
  { value: SEARCH_MODE.NORMAL, label: '普通搜索' },
  { value: SEARCH_MODE.SEMANTIC, label: 'AI语义搜索' },
  { value: SEARCH_MODE.IMAGE, label: '以图搜图' },
]

// ============ URL 查询参数键名 ============
export const SEARCH_URL_PARAMS = {
  MODE: 'mode',
  QUERY: 'q',
  SIMILARITY: 'similarity',
  PICTURE_ID: 'pictureId',
}

// ============ 分页配置 ============
export const PAGINATION = {
  DEFAULT_CURRENT: 1,
  DEFAULT_PAGE_SIZE: 12,
  DEFAULT_SORT_FIELD: 'createTime',
  DEFAULT_SORT_ORDER: 'descend' as const,
}

// ============ 相似度阈值配置 ============
export const SIMILARITY_THRESHOLD = {
  DEFAULT: 0.5,
  MIN: 0,
  MAX: 1,
  STEP: 0.05,
  // 阈值区间边界
  LOOSE_THRESHOLD: 0.3,
  STRICT_THRESHOLD: 0.7,
}

export type SimilarityLevel = 'loose' | 'balanced' | 'strict'

export interface SimilarityLevelConfig {
  key: SimilarityLevel
  label: string
  color: string
}

export const SIMILARITY_LEVELS: Record<SimilarityLevel, SimilarityLevelConfig> = {
  loose: {
    key: 'loose',
    label: '宽松 - 匹配更多图片',
    color: 'green',
  },
  balanced: {
    key: 'balanced',
    label: '均衡 - 推荐',
    color: 'blue',
  },
  strict: {
    key: 'strict',
    label: '严格 - 精确匹配',
    color: 'orange',
  },
}

/**
 * 根据相似度值获取对应的级别
 */
export function getSimilarityLevel(value: number): SimilarityLevel {
  if (value < SIMILARITY_THRESHOLD.LOOSE_THRESHOLD) {
    return 'loose'
  } else if (value < SIMILARITY_THRESHOLD.STRICT_THRESHOLD) {
    return 'balanced'
  }
  return 'strict'
}

/**
 * 获取相似度标签文字
 */
export function getSimilarityLabel(value: number): string {
  const level = getSimilarityLevel(value)
  return SIMILARITY_LEVELS[level].label
}

/**
 * 获取相似度标签颜色
 */
export function getSimilarityTagColor(value: number): string {
  const level = getSimilarityLevel(value)
  return SIMILARITY_LEVELS[level].color
}

// ============ 语义搜索配置 ============
export const SEMANTIC_SEARCH = {
  DEFAULT_TOP_K: 12,
  PLACEHOLDER: '输入语义描述，如：雪中的宫殿',
}

// ============ 普通搜索配置 ============
export const NORMAL_SEARCH = {
  PLACEHOLDER: '从海量图片中搜索',
}

// ============ 防抖配置 ============
export const DEBOUNCE = {
  SEARCH_INPUT_DELAY: 300,
  SLIDER_CHANGE_DELAY: 150,
}

// ============ 默认分类 ============
export const DEFAULT_CATEGORY = 'all'
