import {
  AudioOutlined,
  CloudOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Breadcrumb,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { createWebDavDownloadInfo } from '../../services/downloadTaskFactory';
import {
  getWebDavProviderHint,
  getWebDavProviderLabel,
  isWebDavAudioFile,
  webDavProviders,
} from '../../services/webDavService';
import { rootStore } from '../../stores/rootStore';

const { Text } = Typography;

const formatSize = (size: number | null): string => {
  if (!size) return '--';
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`;
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};

export const WebDavRoutePanel = observer(() => {
  const { download, list, player, settings, webDav } = rootStore;
  const [form] = Form.useForm<Coral.WebDav.Account>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Coral.WebDav.SafeAccount | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const addMusicLocationType = settings.appSetting?.['list.addMusicLocationType'] ?? 'top';

  useEffect(() => {
    if (webDav.activeAccountId && !webDav.items.length && !webDav.isLoadingDir) {
      webDav.loadDir('/');
    }
  }, [webDav, webDav.activeAccountId]);

  const currentQueue = useMemo(
    () => webDav.audioItems.map((item) => webDav.toMusicInfo(item)),
    [webDav, webDav.audioItems],
  );

  const openAccountModal = (account?: Coral.WebDav.SafeAccount): void => {
    const draft = webDav.createAccountDraft(account);
    setEditingAccount(account ?? null);
    setTestMessage(null);
    form.setFieldsValue(draft);
    setIsModalOpen(true);
  };

  const handleSaveAccount = async (): Promise<void> => {
    const values = await form.validateFields();
    await webDav.saveAccount({
      ...values,
      name: values.name || getWebDavProviderLabel(values.provider),
    });
    setIsModalOpen(false);
    await webDav.loadAccounts();
  };

  const handleTestAccount = async (): Promise<void> => {
    const values = await form.validateFields();
    const result = await webDav.testAccount(values);
    setTestMessage(result.message);
  };

  const playItem = (item: Coral.WebDav.FileItem): void => {
    const musicInfo = webDav.toMusicInfo(item);
    player.playFromQueue(musicInfo, currentQueue.length ? currentQueue : [musicInfo], 'webdav');
  };

  const addToCurrentList = async (item: Coral.WebDav.FileItem): Promise<void> => {
    await list.hydrate();
    if (!list.selectedListId) {
      list.setActionError('没有可添加的本地列表');
      return;
    }
    await list.addMusicsToList(
      list.selectedListId,
      [webDav.toMusicInfo(item)],
      addMusicLocationType,
    );
  };

  const downloadItem = async (item: Coral.WebDav.FileItem): Promise<void> => {
    await download.addAndStartTasks([createWebDavDownloadInfo(webDav.toMusicInfo(item), 'webdav')]);
  };

  return (
    <div className="coral-webdav-route">
      <div className="coral-webdav-toolbar">
        <Space wrap size={10}>
          <Select
            value={webDav.activeAccountId || undefined}
            placeholder="选择网盘账号"
            loading={webDav.isLoadingAccounts}
            style={{ minWidth: 220 }}
            options={webDav.accounts.map((account) => ({
              label: `${account.name} · ${getWebDavProviderLabel(account.provider)}`,
              value: account.id,
            }))}
            onChange={(accountId) => {
              webDav.setActiveAccount(accountId);
              webDav.loadDir('/');
            }}
          />
          <Button icon={<PlusOutlined />} onClick={() => openAccountModal()}>
            添加 WebDAV
          </Button>
          {webDav.activeAccount ? (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => openAccountModal(webDav.activeAccount!)}
              >
                编辑账号
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '删除 WebDAV 账号？',
                    content: webDav.activeAccount?.name,
                    onOk: () => webDav.removeAccount(webDav.activeAccountId),
                  });
                }}
              >
                删除
              </Button>
            </>
          ) : null}
          <Button
            icon={<ReloadOutlined />}
            disabled={!webDav.activeAccountId}
            loading={webDav.isLoadingDir}
            onClick={() => webDav.loadDir()}
          >
            刷新
          </Button>
          <Input.Search
            allowClear
            placeholder="搜索当前目录"
            style={{ width: 260 }}
            value={webDav.filterText}
            onChange={(event) => webDav.setFilterText(event.target.value)}
          />
        </Space>
      </div>

      {webDav.error ? (
        <Alert showIcon type="error" title={webDav.error} style={{ marginBottom: 10 }} />
      ) : null}

      <div className="coral-webdav-breadcrumb">
        <Breadcrumb
          items={webDav.breadcrumbItems.map((item) => ({
            title: (
              <Button type="link" onClick={() => webDav.loadDir(item.path)}>
                {item.title}
              </Button>
            ),
          }))}
        />
      </div>

      <div className="coral-webdav-list scroll">
        {!webDav.activeAccountId ? (
          <Empty
            className="coral-webdav-empty"
            image={<CloudOutlined className="coral-webdav-empty-icon" />}
            description="请先添加一个 WebDAV 网盘账号"
          />
        ) : (
          <Spin spinning={webDav.isLoadingDir}>
            <div className="coral-webdav-file-list">
              {webDav.filteredItems.length ? (
                webDav.filteredItems.map((item) => (
                  <div className="coral-webdav-list-item" key={item.path}>
                    <div className="coral-webdav-item-main">
                      <span className="coral-webdav-item-icon">
                        {item.isDirectory ? <FolderOpenOutlined /> : <AudioOutlined />}
                      </span>
                      <div className="coral-webdav-item-info">
                        {item.isDirectory ? (
                          <Button type="link" onClick={() => webDav.loadDir(item.path)}>
                            {item.name}
                          </Button>
                        ) : (
                          <Text ellipsis>{item.name}</Text>
                        )}
                        <Space size={8}>
                          <Tag>{item.isDirectory ? '目录' : item.ext.toUpperCase() || '文件'}</Tag>
                          {item.isAudio ? <Tag color="green">音频</Tag> : null}
                          <Text type="secondary">{formatSize(item.contentLength)}</Text>
                        </Space>
                      </div>
                    </div>
                    {item.isDirectory ? null : (
                      <Space className="coral-webdav-item-actions" size={4}>
                        <Tooltip title="播放">
                          <Button
                            type="text"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            disabled={!isWebDavAudioFile(item)}
                            onClick={() => playItem(item)}
                          />
                        </Tooltip>
                        <Tooltip title="添加到当前列表">
                          <Button
                            type="text"
                            size="small"
                            icon={<FolderAddOutlined />}
                            disabled={!isWebDavAudioFile(item)}
                            onClick={() => addToCurrentList(item)}
                          />
                        </Tooltip>
                        <Tooltip title="下载">
                          <Button
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            disabled={!isWebDavAudioFile(item)}
                            loading={download.isMutatingTask}
                            onClick={() => downloadItem(item)}
                          />
                        </Tooltip>
                      </Space>
                    )}
                  </div>
                ))
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前目录为空" />
              )}
            </div>
          </Spin>
        )}
      </div>

      <Modal
        title={editingAccount ? '编辑 WebDAV 账号' : '添加 WebDAV 账号'}
        open={isModalOpen}
        confirmLoading={webDav.isSaving}
        onOk={handleSaveAccount}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="createdAt" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="updatedAt" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="provider" label="网盘类型" rules={[{ required: true }]}>
            <Select
              options={webDavProviders.map((provider) => ({
                label: provider.label,
                value: provider.value,
              }))}
            />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => (
              <Text type="secondary">
                {getWebDavProviderHint(getFieldValue('provider') ?? 'custom')}
              </Text>
            )}
          </Form.Item>
          <Form.Item name="name" label="名称">
            <Input placeholder="例如：我的阿里云盘" />
          </Form.Item>
          <Form.Item name="url" label="WebDAV 地址" rules={[{ required: true }]}>
            <Input placeholder="https://example.com/dav" />
          </Form.Item>
          <Form.Item name="username" label="用户名">
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码 / Token">
            <Input.Password placeholder={editingAccount?.hasPassword ? '留空则保留原密码' : ''} />
          </Form.Item>
          <Form.Item name="rootPath" label="根目录">
            <Input placeholder="/" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          {testMessage ? <Alert showIcon title={testMessage} style={{ marginBottom: 12 }} /> : null}
          <Button onClick={handleTestAccount}>测试连接</Button>
        </Form>
      </Modal>
    </div>
  );
});
