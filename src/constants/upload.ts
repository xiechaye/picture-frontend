/**
 * 上传相关常量
 */

/**
 * 图片上传最大大小（MB）
 */
export const MAX_UPLOAD_SIZE_MB = 30

/**
 * 允许的图片 MIME 类型白名单
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

/**
 * 允许的图片文件扩展名白名单
 */
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * accept 属性值（用于文件选择器）
 */
export const IMAGE_ACCEPT_ATTRIBUTE = 'image/jpeg,image/png,image/webp'
