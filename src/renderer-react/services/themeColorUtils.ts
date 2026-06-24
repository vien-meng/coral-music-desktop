const rgbLinearShade = (p: number, color: string): string => {
  const i = Number.parseInt
  const r = Math.round
  const [red, green, blue, alpha] = color.split(',')
  const isDark = p < 0
  const target = isDark ? 0 : 255 * p
  const ratio = isDark ? 1 + p : 1 - p
  return `rgb${alpha ? 'a(' : '('}${r(i(red[3] == 'a' ? red.slice(5) : red.slice(4), 10) * ratio + target)},${r(i(green, 10) * ratio + target)},${r(i(blue, 10) * ratio + target)}${alpha ? `,${alpha}` : ')'}`
}

const rgbAlphaShade = (p: number, color: string): string => {
  const i = Number.parseInt
  const isDark = p < 0
  let [red, green, blue, alpha] = color.split(',')
  red = red[3] == 'a' ? red.slice(5) : red.slice(4)
  if (alpha) {
    const alphaValue = Number.parseFloat(alpha)
    alpha = String(isDark
      ? Math.max(0, alphaValue - (1 - alphaValue) * p)
      : Math.min(1, alphaValue - alphaValue * p))
  } else {
    alpha = String(Math.min(1, 1 - p))
  }
  return `rgba(${i(red, 10)}, ${i(green, 10)}, ${i(blue, 10)}, ${Number.parseFloat(alpha).toFixed(2)})`
}

const createFontDarkColors = (
  rgbaColor: string,
  isDarkFont: boolean,
): Record<string, string> => {
  const colors: Record<string, string> = {
    '--color-1000': rgbaColor,
  }
  const step = isDarkFont ? -0.015 : -0.05
  let preColor = rgbaColor
  for (let i = 1; i < 21; i += 1) {
    preColor = rgbLinearShade(step, preColor)
    colors[`--color-${String(1000 - 50 * i).padStart(3, '0')}`] = preColor
  }
  return colors
}

const createFontColors = (
  color: string | null | undefined,
  isDark: boolean,
  isDarkFont: boolean,
): Record<string, string> => {
  const rgbaColor = color ?? (isDark ? 'rgb(229, 229, 229)' : 'rgb(33, 33, 33)')
  if (isDark) return createFontDarkColors(rgbaColor, isDarkFont)

  const colors: Record<string, string> = {
    '--color-1000': rgbaColor,
  }
  const step = (isDarkFont ? 0.02 : 0.05) * (isDark ? -1 : 1)
  for (let i = 1; i < 21; i += 1) {
    colors[`--color-${String(1000 - 50 * i).padStart(3, '0')}`] = rgbLinearShade(step * i, rgbaColor)
  }
  return colors
}

export const createThemeColors = (
  rgbaColor: string,
  fontRgbaColor: string | null | undefined,
  isDark: boolean,
  isDarkFont: boolean,
): Record<string, string> => {
  const colors: Record<string, string> = {
    '--color-primary': rgbaColor,
  }

  let preColor = rgbaColor
  for (let i = 1; i < 11; i += 1) {
    preColor = rgbLinearShade(isDark ? 0.2 : -0.1, preColor)
    colors[`--color-primary-dark-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`--color-primary-dark-${i * 100}-alpha-${j * 100}`] = rgbAlphaShade(0.1 * j, preColor)
      colors[`--color-primary-alpha-${j * 100}`] = rgbAlphaShade(0.1 * j, rgbaColor)
    }
  }

  preColor = rgbaColor
  for (let i = 1; i < 10; i += 1) {
    preColor = rgbLinearShade(isDark ? -0.1 : 0.2, preColor)
    colors[`--color-primary-light-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`--color-primary-light-${i * 100}-alpha-${j * 100}`] = rgbAlphaShade(0.1 * j, preColor)
    }
  }

  preColor = rgbLinearShade(isDark ? -0.35 : 1, preColor)
  colors['--color-primary-light-1000'] = preColor
  for (let j = 1; j < 10; j += 1) {
    colors[`--color-primary-light-1000-alpha-${j * 100}`] = rgbAlphaShade(0.1 * j, preColor)
  }

  colors['--color-theme'] = isDark ? colors['--color-primary-light-900'] : rgbaColor
  return { ...colors, ...createFontColors(fontRgbaColor, isDark, isDarkFont) }
}
