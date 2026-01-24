import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    requestType?: 'form' | 'json'
  }
}
