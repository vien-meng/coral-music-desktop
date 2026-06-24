import needle from 'needle'
import { debugRequest } from './env'
import { requestMsg } from './message'
import { bHh } from './sdk/options'
import { deflateRaw } from 'zlib'
import { proxy } from './sdk/runtimeState'
import { httpOverHttp, httpsOverHttp } from 'tunnel'
import type {
  RequestOptions,
  HttpResponse,
  CancelableRequest,
} from './types/http'

const httpsRxp = /^https:/

interface ProxyInfo {
  enable: boolean
  host: string
  port: string
  envProxy?: {
    host: string
    port: string
  }
}

const getRequestAgent = (url: string) => {
  const proxyInfo = proxy as ProxyInfo
  let options: { proxy: { host: string, port: string } } | undefined
  if (proxyInfo.enable && proxyInfo.host) {
    options = {
      proxy: {
        host: proxyInfo.host,
        port: proxyInfo.port,
      },
    }
  } else if (proxyInfo.envProxy) {
    options = {
      proxy: {
        host: proxyInfo.envProxy.host,
        port: proxyInfo.envProxy.port,
      },
    }
  }
  return options ? (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)(options as never) : undefined
}

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
}

const logRequest = (url: string): void => {
  if (!debugRequest) return
  console.log(`\n---send request------${url}------------`)
}

const logResponse = (url: string, body: unknown): void => {
  if (!debugRequest) return
  console.log(`\n---response------${url}------------`)
  console.log(body)
}

const logError = (url: string, err: unknown): void => {
  if (!debugRequest) return
  console.log(`\n---response------${url}------------`)
  console.log(JSON.stringify(err))
}

type RequestCallback = (
  err: Error | null,
  resp: HttpResponse | null,
  body: unknown,
) => void

const sendRequest = (
  url: string,
  options: RequestOptions,
  callback: RequestCallback,
): NodeJS.ReadableStream => {
  let data: needle.BodyData = null as needle.BodyData
  if (options.body) {
    data = options.body as needle.BodyData
  } else if (options.form) {
    data = options.form as needle.BodyData
    options.json = false
  } else if (options.formData) {
    data = options.formData as needle.BodyData
    options.json = false
  }
  options.response_timeout = options.timeout

  return needle.request(
    options.method ?? 'get',
    url,
    data,
    options as needle.NeedleOptions,
    (err, resp, body) => {
      if (!err && resp) {
        body = resp.body = resp.raw.toString()
        try {
          resp.body = JSON.parse(resp.body as string)
        } catch (_) {}
        body = resp.body
      }
      callback(err, resp as HttpResponse | null, body)
    },
  )
}

const handleDeflateRaw = async(data: Buffer): Promise<Buffer> => new Promise((resolve, reject) => {
  deflateRaw(data, (err, buf) => {
    if (err) {
      reject(err)
      return
    }
    resolve(buf)
  })
})

const regx = /(?:\d\w)+/g

const fetchData = async<T = unknown>(
  url: string,
  method: string,
  {
    headers = {},
    format = 'json',
    timeout = 15000,
    signal,
    ...options
  }: RequestOptions = {},
): Promise<HttpResponse<T>> => {
  headers = Object.assign({}, headers)
  const headerMap = headers as Record<string, unknown>
  if (headerMap[bHh]) {
    const path = url.replace(/^https?:\/\/[\w.:]+\//, '/')
    let s = Buffer.from(bHh, 'hex').toString()
    s = s.replace(s.substr(-1), '')
    s = Buffer.from(s, 'base64').toString()
    const appVersion = process.versions.app
    const v = appVersion.split('-')[0].split('.').map(n => n.length < 3 ? n.padStart(3, '0') : n).join('')
    const v2 = appVersion.split('-')[1] ?? ''
    headerMap[s] = !s || `${(await handleDeflateRaw(Buffer.from(JSON.stringify(`${path}${v}`.match(regx), null, 1).concat(v)))).toString('hex')}&${parseInt(v)}${v2}`
    Reflect.deleteProperty(headerMap, bHh)
  }

  return new Promise<HttpResponse<T>>((resolve, reject) => {
    const stream = sendRequest(
      url,
      {
        ...options,
        method: method as RequestOptions['method'],
        headers: Object.assign({}, defaultHeaders, headers),
        timeout,
        agent: getRequestAgent(url),
        json: format === 'json',
      },
      (err, resp) => {
        if (err) {
          reject(err)
          return
        }
        resolve(resp as HttpResponse<T>)
      },
    ) as NodeJS.ReadableStream & { destroy?: () => void }

    if (signal) {
      if (signal.aborted) {
        stream.destroy?.()
        reject(new Error(requestMsg.cancelRequest))
        return
      }
      signal.addEventListener('abort', () => {
        stream.destroy?.()
        reject(new Error(requestMsg.cancelRequest))
      }, { once: true })
    }
  })
}

export const cancelHttp = (requestObj: { abort?: () => void } | null | undefined): void => {
  if (!requestObj) return
  if (!requestObj.abort) return
  requestObj.abort()
}

const buildHttpPromise = <T = unknown>(
  url: string,
  options: RequestOptions,
): CancelableRequest<HttpResponse<T>> => {
  const controller = new AbortController()

  const obj: CancelableRequest<HttpResponse<T>> = {
    promise: fetchData<T>(url, options.method ?? 'get', { ...options, signal: controller.signal })
      .then(resp => {
        logResponse(url, resp.body)
        return resp
      })
      .catch(err => {
        logError(url, err)
        throw err
      }),
    cancelHttp: () => {
      controller.abort()
    },
  }

  return obj
}

export const httpFetch = <T = unknown>(
  url: string,
  options: RequestOptions = { method: 'get' },
): CancelableRequest<HttpResponse<T>> => {
  logRequest(url)
  const requestObj = buildHttpPromise<T>(url, options)
  requestObj.promise = requestObj.promise.catch(async err => {
    if (err.message === 'socket hang up') {
      throw new Error(requestMsg.unachievable)
    }
    switch (err.code) {
      case 'ETIMEDOUT':
      case 'ESOCKETTIMEDOUT':
        throw new Error(requestMsg.timeout)
      case 'ENOTFOUND':
        throw new Error(requestMsg.notConnectNetwork)
      default:
        throw err
    }
  })
  return requestObj
}

export const http = async <T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<HttpResponse<T>> => {
  if (options.method == null) options.method = 'get'

  logRequest(url)
  try {
    const resp = await fetchData<T>(url, options.method, options)
    logResponse(url, resp.body)
    return resp
  } catch (err) {
    logError(url, err)
    throw err
  }
}

export const httpGet = async<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<HttpResponse<T>> => {
  return http<T>(url, { ...options, method: 'get' })
}

export const httpPost = async<T = unknown>(
  url: string,
  data?: unknown,
  options: RequestOptions = {},
): Promise<HttpResponse<T>> => {
  return http<T>(url, { ...options, method: 'post', body: data })
}

export const httpJsonp = async <T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<HttpResponse<T>> => {
  const callbackName = options.jsonpCallback ?? 'jsonpCallback'
  const separator = url.includes('?') ? '&' : '?'
  const jsonpUrl = `${url}${separator}${callbackName}=jsonpCallback`

  const resp = await http<T>(jsonpUrl, {
    ...options,
    method: 'get',
    format: 'script',
  })

  const body = JSON.parse(
    (resp.raw.toString()).replace(
      /^jsonpCallback\(({.*})\)$/,
      '$1',
    ),
  ) as T

  return { ...resp, body }
}

export const http_jsonp = httpJsonp

export const checkUrl = async(
  url: string,
  options: RequestOptions = {},
): Promise<void> => {
  const resp = await fetchData(url, 'head', options)
  if (resp.statusCode === 200) return
  throw new Error(String(resp.statusCode))
}
