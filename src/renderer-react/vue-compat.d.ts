declare module 'vue' {
  export interface App {
    config: {
      globalProperties: Record<string, unknown>
    }
  }

  export interface Ref<T> {
    value: T
  }

  export const ref: <T>(value: T) => Ref<T>
  export type Component = unknown
}
