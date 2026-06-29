import {
  CloseOutlined,
  CompressOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FontSizeOutlined,
  LockOutlined,
  MinusOutlined,
  PlusOutlined,
  PushpinOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Space, Tag, Tooltip } from 'antd';
import { observer } from 'mobx-react-lite';
import { lyricRootStore } from '../../stores/lyricRootStore';

const stopContextMenu = (event: React.MouseEvent): void => {
  event.preventDefault();
};

export const ControlBar = observer(() => {
  const { config } = lyricRootStore;

  return (
    <div
      className="lyric-control-bar"
      onMouseDown={(event) => {
        event.stopPropagation();
      }}
      onTouchStart={(event) => {
        event.stopPropagation();
      }}
    >
      <Space size={4} wrap>
        <Tooltip title="关闭">
          <Button
            size="small"
            type="text"
            icon={<CloseOutlined />}
            onClick={() => {
              lyricRootStore.setEnabled(false);
            }}
          />
        </Tooltip>
        <Tooltip title={lyricRootStore.isLocked ? '解锁' : '锁定'}>
          <Button
            size="small"
            type="text"
            icon={lyricRootStore.isLocked ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => {
              lyricRootStore.toggleLock();
            }}
          />
        </Tooltip>
        <Space.Compact size="small">
          <Tooltip title="字号减小">
            <Button
              type="text"
              icon={<MinusOutlined />}
              onClick={() => {
                lyricRootStore.changeFontSize(-1);
              }}
            />
          </Tooltip>
          <Button type="text" icon={<FontSizeOutlined />} tabIndex={-1} />
          <Tooltip title="字号增大">
            <Button
              type="text"
              icon={<PlusOutlined />}
              onClick={() => {
                lyricRootStore.changeFontSize(1);
              }}
            />
          </Tooltip>
        </Space.Compact>
        <Space.Compact size="small">
          <Tooltip title="透明度降低">
            <Button
              type="text"
              icon={<EyeInvisibleOutlined />}
              onClick={() => {
                lyricRootStore.changeOpacity(-10);
              }}
              onContextMenu={(event) => {
                stopContextMenu(event);
                lyricRootStore.changeOpacity(-2);
              }}
            />
          </Tooltip>
          <Tooltip title="透明度提高">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                lyricRootStore.changeOpacity(10);
              }}
              onContextMenu={(event) => {
                stopContextMenu(event);
                lyricRootStore.changeOpacity(2);
              }}
            />
          </Tooltip>
        </Space.Compact>
        <Tooltip
          title={config['desktopLyric.style.isZoomActiveLrc'] ? '关闭当前行放大' : '开启当前行放大'}
        >
          <Button
            size="small"
            type="text"
            icon={<CompressOutlined />}
            className={config['desktopLyric.style.isZoomActiveLrc'] ? 'is-active' : undefined}
            onClick={() => {
              lyricRootStore.toggleActiveLyricZoom();
            }}
          />
        </Tooltip>
        <Tooltip title={config['desktopLyric.isAlwaysOnTop'] ? '取消置顶' : '窗口置顶'}>
          <Button
            size="small"
            type="text"
            icon={<PushpinOutlined />}
            className={config['desktopLyric.isAlwaysOnTop'] ? 'is-active' : undefined}
            onClick={() => {
              lyricRootStore.toggleAlwaysOnTop();
            }}
          />
        </Tooltip>
        <Segmented
          size="small"
          value={lyricRootStore.direction}
          options={[
            { label: '横向', value: 'horizontal' },
            { label: '竖向', value: 'vertical' },
          ]}
          onChange={(value) => {
            lyricRootStore.setDirection(value as LX.DesktopLyric.Config['desktopLyric.direction']);
          }}
        />
        <Tag color={lyricRootStore.isConnectedToMainWindow ? 'green' : 'default'}>
          {lyricRootStore.isConnectedToMainWindow ? '已连接' : '待连接'}
        </Tag>
      </Space>
    </div>
  );
});
