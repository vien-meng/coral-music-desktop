import { Input, Modal, Select, Typography, message } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { coralProjectLinks } from '@shared/brand';
import { openUrl } from '../../../services/appService';
import { getSourceDisplayName } from '../../../services/sourceNameService';
import { rootStore } from '../../../stores/rootStore';

const { Text } = Typography;

export interface OpenListModalProps {
  open: boolean;
  onClose: () => void;
}

export const OpenListModal = observer(({ open, onClose }: OpenListModalProps) => {
  const { library, songList, ui } = rootStore;
  const [source, setSource] = useState(songList.activeSource);
  const [text, setText] = useState('');

  useEffect(() => {
    if (open) {
      setSource(songList.activeSource);
      setText('');
    }
  }, [open, songList.activeSource]);

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    try {
      const favorite = await songList.importSongListToFavorites(source, text, library);
      ui.setActiveFavoritesTab('songlists');
      ui.setActiveRoute('favorites');
      message.success(`已导入歌单：${favorite.name}`);
      onClose();
    } catch (error) {
      message.error(`导入失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }, [library, onClose, songList, source, text, ui]);

  return (
    <Modal
      open={open}
      title="导入歌单"
      width={640}
      okText="确定"
      okButtonProps={{ disabled: !text.trim(), loading: songList.isImportingSongList }}
      onOk={handleSubmit}
      onCancel={onClose}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, padding: '15px 0' }}>
        <div style={{ display: 'flex', flexFlow: 'row nowrap' }}>
          <Select
            value={source}
            onChange={(value: Coral.OnlineSource) => {
              setSource(value);
            }}
            options={songList.sources.map((s) => ({ label: getSourceDisplayName(s), value: s }))}
            style={{ width: 120 }}
            className="coral-open-list-source-select"
          />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
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
                onClick={async () => {
                  if (coralProjectLinks.songListFaq) await openUrl(coralProjectLinks.songListFaq);
                }}
              >
                {' '}
                FAQ
              </Text>
            </li>
          </ol>
        </div>
      </div>
    </Modal>
  );
});
