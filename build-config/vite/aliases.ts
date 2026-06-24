import path from 'node:path'

const root = path.resolve(__dirname, '../..')

export const projectRoot = root

export const aliases = {
  '@root': path.join(root, 'src'),
  '@main': path.join(root, 'src/main'),
  '@renderer': path.join(root, 'src/renderer-react'),
  '@renderer-react': path.join(root, 'src/renderer-react'),
  '@lyric': path.join(root, 'src/lyric-react'),
  '@lyric-react': path.join(root, 'src/lyric-react'),
  '@static': path.join(root, 'src/static'),
  '@common': path.join(root, 'src/common'),
  '@shared': path.join(root, 'src/shared'),
}
