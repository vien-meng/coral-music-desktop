import { Input, Modal, Select, Typography } from 'antd'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useState } from 'react'
import { coralProjectLinks } from '@shared/brand'
import { openUrl } from '../../../services/appService'
import { rootStore } from '../../../stores/rootStore'

const { Text } = Typography

export interface OpenListModalProps {
  open: boolean
  onClose: () => void
}

export const OpenListModal = observer(({ open, onClose }: OpenListModalProps) => {
  const { songList } = rootStore
  const [source, setSource] = useState(songList.activeSource)
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) {
      setSource(songList.activeSource)
      setText('')
    }
  }, [open, songList.activeSource])

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return
    songList.setOpenSongListInputInfo({ source, text })
    onClose()
  }, [text, source, songList, onClose])

  return (
    <Modal
      open={open}
      title="导入歌单"
      width={640}
      okText="确定"
      okButtonProps={{ disabled: !text.trim() }}
      onOk={handleSubmit}
      onCancel={onClose}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, padding: '15px 0' }}>
        <div style={{ display: 'flex', flexFlow: 'row nowrap' }}>
          <Select
            value={source}
            onChange={setSource}
            options={songList.sources.map(s => ({ label: s.toUpperCase(), value: s }))}
            style={{ width: 80 }}
            className="coral-open-list-source-select"
          />
          <Input
            value={text}
            onChange={e => { setText(e.target.value) }}
            placeholder="歌单链接 / ID"
            onPressEnter={handleSubmit}
            style={{ flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>
          <ol style={{ paddingLeft: 15, margin: 0 }}>
            <li>支持输入歌单链接或歌单 ID</li>
            <li>目前支持的平台：酷我、酷狗、QQ、网易云、咪咕</li>
            <li>歌单链接仅支持各平台的官方歌单链接</li>
            <li>
              如果无法打开，请参考
              <Text
                className="coral-link-text"
                onClick={async() => {
                  if (coralProjectLinks.songListFaq) await openUrl(coralProjectLinks.songListFaq)
                }}
              >
                {' '}FAQ
              </Text>
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  )
})
