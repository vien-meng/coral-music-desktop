import { Modal, Radio } from 'antd';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { rootStore } from '../../stores/rootStore';

export const SyncConflictModal = observer(() => {
  const { sync } = rootStore;
  const [selectedMode, setSelectedMode] =
    useState<Coral.Sync.ModeTypes[keyof Coral.Sync.ModeTypes]>('merge_local_remote');
  const action = sync.lastAction?.action === 'select_mode' ? sync.lastAction : null;
  const options =
    action?.data.type === 'dislike'
      ? [
          { label: '合并本地到远端', value: 'merge_local_remote' },
          { label: '合并远端到本地', value: 'merge_remote_local' },
          { label: '用本地覆盖远端', value: 'overwrite_local_remote' },
          { label: '用远端覆盖本地', value: 'overwrite_remote_local' },
          { label: '取消', value: 'cancel' },
        ]
      : [
          { label: '合并本地到远端', value: 'merge_local_remote' },
          { label: '合并远端到本地', value: 'merge_remote_local' },
          { label: '用本地覆盖远端', value: 'overwrite_local_remote' },
          { label: '用远端覆盖本地', value: 'overwrite_remote_local' },
          { label: '完全用本地覆盖远端', value: 'overwrite_local_remote_full' },
          { label: '完全用远端覆盖本地', value: 'overwrite_remote_local_full' },
          { label: '取消', value: 'cancel' },
        ];

  return (
    <Modal
      open={Boolean(action)}
      title={`同步${action?.data.type === 'dislike' ? '不感兴趣规则' : '歌单'}：${action?.data.deviceName ?? ''}`}
      okText="开始同步"
      cancelText="取消"
      confirmLoading={sync.isMutating}
      onCancel={() => {
        sync.resolveSelectMode('cancel').catch(() => {});
      }}
      onOk={() => {
        sync.resolveSelectMode(selectedMode).catch(() => {});
      }}
    >
      <Radio.Group
        value={selectedMode}
        options={options}
        onChange={(event) => {
          setSelectedMode(event.target.value);
        }}
      />
    </Modal>
  );
});
