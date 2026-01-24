import type { App, DefineComponent } from 'vue'

declare module 'vue-cropper' {
  export interface VueCropperProps {
    img?: string
    outputSize?: number
    outputType?: 'jpeg' | 'png' | 'webp'
    info?: boolean
    canScale?: boolean
    autoCrop?: boolean
    autoCropWidth?: number
    autoCropHeight?: number
    fixed?: boolean
    fixedNumber?: [number, number]
    full?: boolean
    fixedBox?: boolean
    canMove?: boolean
    canMoveBox?: boolean
    original?: boolean
    centerBox?: boolean
    high?: boolean
    infoTrue?: boolean
    maxImgSize?: number
    enlarge?: number
    mode?: string
  }

  export const VueCropper: DefineComponent<VueCropperProps>

  const VueCropperPlugin: {
    install: (app: App) => void
  }

  export default VueCropperPlugin
}

declare module 'echarts-wordcloud' {
  // 词云图扩展，无需额外类型定义
}
