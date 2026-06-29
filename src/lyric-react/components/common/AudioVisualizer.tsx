import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { lyricRootStore } from '../../stores/lyricRootStore';

const getBarWidth = (canvasWidth: number): number => {
  const barWidth = (canvasWidth / 128) * 2.5;
  const width = canvasWidth / 86;
  const diffWidth = barWidth - width;

  if (diffWidth > 32) return canvasWidth / 128;
  if (diffWidth > 12) return width;
  return barWidth;
};

export const AudioVisualizer = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserData = lyricRootStore.analyserData;
  const isActive = lyricRootStore.isAudioVisualizationActive;

  const cancelNextFrame = useCallback(() => {
    if (animationFrameRef.current == null) return;
    window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawFrame = useCallback(
    (dataArray: Uint8Array) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context || !dataArray.length) return;

      resizeCanvas();

      const width = canvas.width;
      const height = canvas.height;
      const maxHeight = Math.round(((height * 0.46) / 255) * 10000) / 10000;
      const barWidth = getBarWidth(width);
      const maxNum = 255;
      let frequencyAvg = 0;
      let x = 0;

      context.clearRect(0, 0, width, height);
      context.fillStyle = 'rgba(255, 255, 255, .12)';

      for (let index = 0; index < dataArray.length; index += 1) {
        const mult = Math.floor(index / maxNum);
        const num = mult % 2 === 0 ? index - maxNum * mult : maxNum - (index - maxNum * mult);
        const spectrum = num > 90 ? 0 : (dataArray[num + 20] ?? 0);
        frequencyAvg += spectrum * 1.4;
      }

      frequencyAvg = ((frequencyAvg / dataArray.length) * 1.6) / maxNum;

      for (let index = 0; index < dataArray.length; index += 1) {
        if (x > width) break;

        const data = dataArray[index] ?? 0;
        const barHeight = (data * frequencyAvg + data * 0.42) * maxHeight;
        context.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth;
      }
    },
    [resizeCanvas],
  );

  useEffect(() => {
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    if (!isActive) {
      cancelNextFrame();
      clearCanvas();
      return;
    }

    lyricRootStore.requestAnalyserData();
  }, [cancelNextFrame, clearCanvas, isActive]);

  useEffect(() => {
    if (!isActive || !analyserData) return;

    drawFrame(analyserData);
    cancelNextFrame();
    animationFrameRef.current = window.requestAnimationFrame(() => {
      lyricRootStore.requestAnalyserData();
    });
  }, [analyserData, cancelNextFrame, drawFrame, isActive]);

  useEffect(
    () => () => {
      cancelNextFrame();
    },
    [cancelNextFrame],
  );

  if (!lyricRootStore.config['desktopLyric.audioVisualization']) return null;

  return (
    <div className="lyric-audio-visualizer">
      <canvas ref={canvasRef} className="lyric-audio-visualizer-canvas" />
    </div>
  );
});
