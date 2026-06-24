import './vendors/infSign.min.js'

type InfSign = (
  params: Record<string, unknown>,
  body: unknown,
  options: Record<string, unknown>,
) => void

const infSign = (globalThis as typeof globalThis & { infSign?: InfSign }).infSign

if (!infSign) {
  throw new Error('infSign vendor failed to initialize')
}

export default infSign
