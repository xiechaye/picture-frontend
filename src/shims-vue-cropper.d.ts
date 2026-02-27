// vue-cropper 类型声明
declare module 'vue-cropper' {
  import type { DefineComponent, Plugin } from 'vue'
  const VueCropper: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  const VueCropperPlugin: Plugin
  export { VueCropper }
  export default VueCropperPlugin
}

// 忽略 vue-cropper 内部模块的类型检查
declare module 'vue-cropper/lib/vue-cropper.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module './vue-cropper.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// 忽略 vue-cropper 的 index.ts
declare module 'vue-cropper/lib/index' {
  export * from 'vue-cropper'
}
