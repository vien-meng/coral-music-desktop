import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { rootStore } from '../../stores/rootStore'

const getBarWidth = (canvasWidth: number): number => {
  const barWidth = (canvasWidth / 128) * 2.5
  const width = canvasWidth / 86
  const diffWidth = barWidth - width
  if (diffWidth > 32) return canvasWidth / 128
  return diffWidth > 12 ? width : barWidth
}

export const AudioVisualizer = observer(() => {
  const { player } = rootStore
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const analyser = player.getAnalyser()
    if (!canvas || !analyser) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    const resize = (): void => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    const stop = (): void => {
      if (frameRef.current == null) return
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    resize()
    window.addEventListener('resize', resize)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const render = (): void => {
      const width = canvas.width
      const height = canvas.height
      const maxHeight = Math.round(height * 0.4 / 255 * 10000) / 10000
      const barWidth = getBarWidth(width)
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-light-200-alpha-800') || 'rgba(24, 144, 255, 0.18)'

      analyser.getByteFrequencyData(dataArray)
      context.clearRect(0, 0, width, height)
      context.fillStyle = themeColor

      let frequencyAvg = 0
      const maxNum = 255
      for (let index = 0; index < bufferLength; index += 1) {
        const mult = Math.floor(index / maxNum)
        const num = mult % 2 === 0
          ? index - maxNum * mult
          : maxNum - (index - maxNum * mult)
        const spectrum = num > 90 ? 0 : dataArray[num + 20]
        frequencyAvg += spectrum * 1.2
      }
      frequencyAvg = frequencyAvg / bufferLength * 1.4 / maxNum

      let x = 0
      for (let index = 0; index < bufferLength; index += 1) {
        if (x > width) break
        const barHeight = (dataArray[index] * frequencyAvg + dataArray[index] * 0.42) * maxHeight
        context.fillRect(x, height - barHeight, barWidth, barHeight)
        x += barWidth
      }

      frameRef.current = window.requestAnimationFrame(render)
    }

    if (player.isPlaying) render()

    return () => {
      stop()
      window.removeEventListener('resize', resize)
    }
  }, [player, player.isPlaying])

  return (
    <div className="coral-audio-visualizer" aria-hidden="true">
      <canvas ref={canvasRef} className="coral-audio-visualizer-canvas" />
    </div>
  )
})
