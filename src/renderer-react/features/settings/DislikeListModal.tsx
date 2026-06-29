import { Button, Input, message, Modal, Typography } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

interface DislikeListModalProps {
  onClose: () => void;
  onSaved?: () => void;
  open: boolean;
}

export const DislikeListModal = observer(({ onClose, onSaved, open }: DislikeListModalProps) => {
  const { dislike } = rootStore;
  const [rules, setRules] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const current = dislike.dislikeInfo.rules;
    setRules(current.length ? `${current}\n` : current);
  }, [dislike.dislikeInfo.rules, open]);

  const handleSave = async (): Promise<void> => {
    if (rules.trim() === dislike.dislikeInfo.rules.trim()) {
      onSaved?.();
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      await dislike.overwriteDislikeMusicInfos(rules);
      onSaved?.();
      onClose();
    } catch (err) {
      message.error(`保存失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="不感兴趣列表"
      onCancel={onClose}
      width="80%"
      footer={[
        <Text key="tips" type="secondary" style={{ marginRight: 'auto', fontSize: 12 }}>
          每行一条规则，格式：歌名-歌手
        </Text>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={isSaving}>
          保存
        </Button>,
      ]}
    >
      <Input.TextArea
        autoFocus
        value={rules}
        onChange={(event) => {
          setRules(event.target.value);
        }}
        placeholder="每行一条规则，格式：歌名-歌手"
        style={{ height: '50vh', resize: 'none' }}
      />
    </Modal>
  );
});
