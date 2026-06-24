import { CloseOutlined, CopyOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Typography, message } from 'antd'
import { observer } from 'mobx-react-lite'
import { clipboardService } from '../../services/clipboardService'
import { rootStore } from '../../stores/rootStore'

const { Text, Title } = Typography

const copyText = async(text: string): Promise<void> => {
  const value = text.trim()
  if (!value) return
  await clipboardService.writeText(value)
}

export const LyricSelectionPanel = observer(() => {
  const { player } = rootStore
  const lyricText = player.lyricSelectionText

  const handleCopyAll = async(): Promise<void> => {
    await copyText(lyricText)
    void message.success('歌词已复制')
  }

  const handleCopySelected = (event: React.MouseEvent<HTMLDivElement>): void => {
    const selectedText = window.getSelection()?.toString().trim() ?? ''
    if (!selectedText) return

    event.preventDefault()
    void copyText(selectedText).then(() => {
      void message.success('已复制选中歌词')
    })
  }

  return (
    <div className="coral-playdetail-lyric-select">
      <Flex align="center" justify="space-between" className="coral-playdetail-lyric-select-header">
        <div>
          <Text type="secondary">歌词文本</Text>
          <Title level={5}>可选中复制</Title>
        </div>
        <Flex gap={8}>
          <Button
            aria-label="复制全部歌词"
            disabled={!lyricText.trim()}
            icon={<CopyOutlined />}
            shape="circle"
            onClick={() => { void handleCopyAll() }}
          />
          <Button
            aria-label="关闭歌词文本"
            icon={<CloseOutlined />}
            shape="circle"
            onClick={() => { player.closeLyricSelection() }}
          />
        </Flex>
      </Flex>
      {player.lyricSelectionLines.length
        ? (
          <div className="coral-playdetail-lyric-select-content" onContextMenu={handleCopySelected}>
            {player.lyricSelectionLines.map((line, index) => (
              <p key={`${index}-${line}`}>{line}</p>
            ))}
          </div>
          )
        : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无歌词"
            className="coral-playdetail-empty"
          />
          )}
    </div>
  )
})
