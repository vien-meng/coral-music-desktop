import { Button, Checkbox, InputNumber, message, Modal, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { rootStore } from '../../stores/rootStore';
import { timeoutStopService } from '../../services/timeoutStopService';

const { Text } = Typography;

const MAX_MIN = 1440;
const RXP = /([1-9]\d*)/;

interface PlayTimeoutModalProps {
  onClose: () => void;
  open: boolean;
}

export const PlayTimeoutModal = observer(({ onClose, open }: PlayTimeoutModalProps) => {
  const { settings } = rootStore;
  const appSetting = settings.appSetting;
  const [time, setTime] = useState<number | null>(0);

  useEffect(() => {
    if (!open || !appSetting) return;
    const raw = appSetting['player.waitPlayEndStopTime'];
    setTime(raw ? parseInt(raw, 10) || 0 : 0);
  }, [appSetting, open]);

  const timeLabel = timeoutStopService.store.timeLabel;

  const verify = (): number | '' => {
    if (time == null) return '';
    const orgText = String(time);
    let text = orgText;
    const match = text.match(RXP);
    if (match) {
      text = match[1];
      if (parseInt(text, 10) > MAX_MIN) {
        text = String(MAX_MIN);
      }
    } else {
      text = '';
    }
    const parsed = text ? parseInt(text, 10) : null;
    setTime(parsed);
    return text && orgText === text ? parseInt(text, 10) : '';
  };

  const handleConfirm = async (): Promise<void> => {
    try {
      const verified = verify();
      if (verified === '') return;
      const verifiedStr = String(verified);
      if (appSetting && appSetting['player.waitPlayEndStopTime'] !== verifiedStr) {
        await settings.updateAppSetting({ 'player.waitPlayEndStopTime': verifiedStr });
      }
      timeoutStopService.start(verified * 60);
      onClose();
    } catch (err) {
      message.error(`设置失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCancel = (): void => {
    if (timeLabel) {
      timeoutStopService.stop();
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      title="定时停止播放"
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {timeLabel ? '停止' : '关闭'}
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          {timeLabel ? '更新' : '确认'}
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InputNumber
            autoFocus
            min={1}
            max={MAX_MIN}
            value={time}
            onChange={(value) => {
              setTime(value);
            }}
            style={{ flex: 'auto' }}
          />
          <Text type="secondary">分钟</Text>
        </div>
        <Checkbox
          checked={appSetting?.['player.waitPlayEndStop'] ?? false}
          onChange={(event) => {
            if (appSetting) {
              settings.updateAppSetting({ 'player.waitPlayEndStop': event.target.checked });
            }
          }}
        >
          等待播放结束再停止
        </Checkbox>
        {timeLabel ? <Text type="secondary">剩余 {timeLabel}</Text> : null}
      </div>
    </Modal>
  );
});
