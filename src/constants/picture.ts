/**
 * 图片审核状态
 * @author chaye
 */
export const PIC_REVIEW_STATUS_ENUM = {
  REVIEWING: 0,
  PASS: 1,
  REJECT: 2,
}

/**
 * 图片审核状态文案
 */
export const PIC_REVIEW_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '通过',
  2: '拒绝',
}

/**
 * 图片审核下拉表单选项
 */
export const PIC_REVIEW_STATUS_OPTIONS = Object.keys(PIC_REVIEW_STATUS_MAP).map((key) => {
  return {
    label: PIC_REVIEW_STATUS_MAP[Number(key)],
    value: key,
  }
})

/**
 * 图片编辑消息类型枚举
 */
export const PICTURE_EDIT_MESSAGE_TYPE_ENUM = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  ENTER_EDIT: 'ENTER_EDIT',
  EXIT_EDIT: 'EXIT_EDIT',
  EDIT_ACTION: 'EDIT_ACTION',
};

/**
 * 图片编辑消息类型映射
 */
export const PICTURE_EDIT_MESSAGE_TYPE_MAP = {
  INFO: '发送通知',
  ERROR: '发送错误',
  ENTER_EDIT: '进入编辑状态',
  EXIT_EDIT: '退出编辑状态',
  EDIT_ACTION: '执行编辑操作',
};

/**
 * 图片编辑操作枚举
 */
export const PICTURE_EDIT_ACTION_ENUM = {
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',
  ROTATE_LEFT: 'ROTATE_LEFT',
  ROTATE_RIGHT: 'ROTATE_RIGHT',
};

/**
 * 图片编辑操作映射
 */
export const PICTURE_EDIT_ACTION_MAP = {
  ZOOM_IN: '放大操作',
  ZOOM_OUT: '缩小操作',
  ROTATE_LEFT: '左旋操作',
  ROTATE_RIGHT: '右旋操作',
};

/**
 * AI 图片编辑类型枚举
 */
export const AI_EDIT_TYPE_ENUM = {
  SEGMENT: 'SEGMENT',
  REMOVE_WATERMARK: 'REMOVE_WATERMARK',
  ENHANCE: 'ENHANCE',
  REPLACE_BACKGROUND: 'REPLACE_BACKGROUND',
} as const;

/**
 * AI 编辑类型文本映射
 */
export const AI_EDIT_TYPE_MAP: Record<string, string> = {
  SEGMENT: '智能抠图',
  REMOVE_WATERMARK: '去除水印',
  ENHANCE: '图片增强',
  REPLACE_BACKGROUND: '背景替换',
};

/**
 * 抠图类型选项
 */
export const SEGMENT_TYPE_OPTIONS = [
  { label: '人像抠图', value: 'human' },
  { label: '物体抠图', value: 'object' },
];

/**
 * 增强类型选项
 */
export const ENHANCE_TYPE_OPTIONS = [
  { label: '质量提升', value: 'quality' },
  { label: '降噪', value: 'denoise' },
  { label: '锐化', value: 'sharpen' },
];

/**
 * 背景类型选项
 */
export const BACKGROUND_TYPE_OPTIONS = [
  { label: '纯色背景', value: 'color' },
  { label: '图片背景', value: 'image' },
  { label: '透明背景', value: 'transparent' },
];

/**
 * 编辑任务状态枚举
 */
export const EDIT_TASK_STATUS_ENUM = {
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;

/**
 * 编辑任务状态文本映射
 */
export const EDIT_TASK_STATUS_MAP: Record<string, string> = {
  PROCESSING: '处理中',
  SUCCESS: '成功',
  FAILED: '失败',
};

/**
 * 允许的图片 MIME 类型
 * 与后端 allowed-picture-formats 和 allowed-file-formats 保持一致
 */
export const ALLOWED_PICTURE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const;

/**
 * 允许的图片格式显示名称
 */
export const ALLOWED_PICTURE_FORMATS = 'JPG、PNG、WEBP、GIF、BMP、ICO';

/**
 * 检查文件是否为允许的图片格式
 */
export const isAllowedPictureFormat = (file: File): boolean => {
  return ALLOWED_PICTURE_MIME_TYPES.includes(file.type as typeof ALLOWED_PICTURE_MIME_TYPES[number]);
};
