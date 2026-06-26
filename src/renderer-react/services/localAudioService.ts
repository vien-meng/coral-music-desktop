import {
  basename,
  extname,
  isDirectory,
  readDirectory,
} from './nodeBridgeService'
import {
  externalDecoderExtensions,
  isExternalDecoderExtension,
  isNativeLocalAudioExtension,
  nativeLocalAudioExtensions,
  normalizeAudioExtension,
} from '@shared/playbackCapabilities'
import type { IAudioMetadata, parseFile } from 'music-metadata'

interface MusicMetadataModule {
  parseFile: typeof parseFile
}

interface MusicMetadataGlobal {
  require?: (moduleName: 'music-metadata') => MusicMetadataModule
}

export interface LocalAudioImportResult {
  candidateCount: number
  duplicateCount: number
  importedMusics: LX.Music.MusicInfoLocal[]
  skippedCount: number
}

export interface LocalAudioImportOptions {
  externalExtensions?: readonly string[]
  nativeExtensions?: readonly string[]
}

const createExtensionSet = (options: LocalAudioImportOptions = {}): Set<string> => {
  return new Set([
    ...(options.nativeExtensions?.length ? options.nativeExtensions : nativeLocalAudioExtensions),
    ...(options.externalExtensions?.length ? options.externalExtensions : externalDecoderExtensions),
  ].map(normalizeAudioExtension))
}

const isSupportedLocalAudioFile = (filePath: string, extensionSet: Set<string>): boolean => {
  const ext = normalizeAudioExtension(extname(filePath))
  return extensionSet.has(ext)
}

const collectLocalAudioFiles = async(
  inputPaths: string[],
  extensionSet: Set<string>,
  visitedPaths = new Set<string>(),
): Promise<string[]> => {
  const results: string[] = []

  for (const inputPath of inputPaths) {
    if (!inputPath || visitedPaths.has(inputPath)) continue
    visitedPaths.add(inputPath)

    if (await isDirectory(inputPath)) {
      const entries = await readDirectory(inputPath)
      const childFiles = await collectLocalAudioFiles(
        entries
          .filter(entry => entry.isDirectory || entry.isFile)
          .map(entry => entry.filePath),
        extensionSet,
        visitedPaths,
      )
      results.push(...childFiles)
    } else if (isSupportedLocalAudioFile(inputPath, extensionSet)) {
      results.push(inputPath)
    }
  }

  return results
}

const parseLocalAudioName = (filePath: string): { name: string, singer: string } => {
  const ext = extname(filePath)
  const baseName = basename(filePath, ext).trim()
  const separatorIndex = baseName.indexOf(' - ')
  if (separatorIndex < 1) return { name: baseName || basename(filePath), singer: '' }

  return {
    name: baseName.slice(separatorIndex + 3).trim() || baseName,
    singer: baseName.slice(0, separatorIndex).trim(),
  }
}

const getMusicMetadataModule = (): MusicMetadataModule | null => {
  try {
    return (globalThis as typeof globalThis & MusicMetadataGlobal).require?.('music-metadata') ?? null
  } catch {
    return null
  }
}

const readLocalAudioMetadata = async(filePath: string): Promise<IAudioMetadata | null> => {
  const musicMetadata = getMusicMetadataModule()
  if (!musicMetadata) return null

  return await musicMetadata
    .parseFile(filePath, { duration: true })
    .catch(() => null)
}

const formatDuration = (duration?: number): string | null => {
  if (!duration || !Number.isFinite(duration) || duration <= 0) return null

  const totalSeconds = Math.round(duration)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)
  const timeParts = hours > 0
    ? [hours, minutes, seconds]
    : [minutes, seconds]

  return timeParts
    .map((value, index) => index === 0 ? String(value) : String(value).padStart(2, '0'))
    .join(':')
}

const trimToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim()
  if (trimmed) return trimmed
  return null
}

const readPictureDataUrl = (metadata: IAudioMetadata): string | null => {
  const picture = metadata.common.picture?.[0]
  if (!picture?.data.length) return null

  const format = picture.format || 'image/jpeg'
  const base64 = Buffer.from(picture.data).toString('base64')
  return `data:${format};base64,${base64}`
}

export const createLocalMusicInfo = (filePath: string): LX.Music.MusicInfoLocal => {
  const { name, singer } = parseLocalAudioName(filePath)
  const ext = normalizeAudioExtension(extname(filePath))

  return {
    id: `local_${filePath}`,
    interval: null,
    meta: {
      albumName: '',
      bitrate: null,
      ext,
      filePath,
      lossless: null,
      picUrl: null,
      sampleRate: null,
      songId: filePath,
    },
    name,
    singer,
    source: 'local',
  }
}

export const enrichLocalMusicInfoWithMetadata = async(
  musicInfo: LX.Music.MusicInfoLocal,
): Promise<LX.Music.MusicInfoLocal> => {
  const filePath = musicInfo.meta.filePath
  const metadata = await readLocalAudioMetadata(filePath)
  if (!metadata) return musicInfo

  const title = trimToNull(metadata.common.title)
  const artist = trimToNull(metadata.common.artist) ??
    trimToNull(metadata.common.artists?.filter(Boolean).join(' / '))
  const album = trimToNull(metadata.common.album)
  const pictureUrl = readPictureDataUrl(metadata)
  const bitrate = metadata.format.bitrate && Number.isFinite(metadata.format.bitrate)
    ? Math.round(metadata.format.bitrate)
    : null
  const sampleRate = metadata.format.sampleRate && Number.isFinite(metadata.format.sampleRate)
    ? metadata.format.sampleRate
    : null

  return {
    ...musicInfo,
    interval: formatDuration(metadata.format.duration),
    meta: {
      ...musicInfo.meta,
      albumName: album ?? musicInfo.meta.albumName,
      bitrate,
      lossless: metadata.format.lossless ?? null,
      picUrl: pictureUrl ?? musicInfo.meta.picUrl,
      sampleRate,
    },
    name: title ?? musicInfo.name,
    singer: artist ?? musicInfo.singer,
  }
}

export const createLocalMusicInfoWithMetadata = async(filePath: string): Promise<LX.Music.MusicInfoLocal> => {
  return await enrichLocalMusicInfoWithMetadata(createLocalMusicInfo(filePath))
}

export const createLocalMusicInfosFromPaths = async(
  inputPaths: string[],
  options: LocalAudioImportOptions = {},
): Promise<LX.Music.MusicInfoLocal[]> => {
  const extensionSet = createExtensionSet(options)
  const filePaths = await collectLocalAudioFiles(inputPaths, extensionSet)
  const uniquePaths = Array.from(new Set(filePaths)).sort((left, right) => left.localeCompare(right))
  return await Promise.all(uniquePaths.map(createLocalMusicInfoWithMetadata))
}

export const isLocalAudioDecoderCandidate = (ext: string): boolean => {
  return isNativeLocalAudioExtension(ext) || isExternalDecoderExtension(ext)
}

export const localAudioService = {
  createLocalMusicInfo,
  createLocalMusicInfoWithMetadata,
  createLocalMusicInfosFromPaths,
  enrichLocalMusicInfoWithMetadata,
  isLocalAudioDecoderCandidate,
}
