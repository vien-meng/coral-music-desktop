import type { NeedleOptions, NeedleResponse } from 'needle';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'head';

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  form?: Record<string, unknown>;
  formData?: Record<string, unknown>;
  timeout?: number;
  format?: 'json' | 'text' | 'buffer' | 'script';
  signal?: AbortSignal;
  jsonpCallback?: string;
  follow_max?: number;
  lookup?: unknown;
  family?: number;
  [key: string]: unknown;
}

export interface HttpResponse<T = unknown> extends Omit<NeedleResponse, 'body'> {
  body: T;
}

export interface RequestError extends Error {
  code?: string;
  statusCode?: number;
}

export interface CancelableRequest<T = HttpResponse> {
  promise: Promise<T>;
  cancelHttp: () => void;
}

export type NeedleRequestOptions = NeedleOptions;
