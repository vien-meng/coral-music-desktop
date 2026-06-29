import { CloseOutlined, LikeOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Empty, Flex, Space, Tabs, Typography, message } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import { PlainList, PlainListItem, PlainListMeta } from '../base';
import {
  musicCommentService,
  type MusicCommentItem,
  type MusicCommentKind,
  type MusicCommentPage,
} from '../../services/musicCommentService';
import { rootStore } from '../../stores/rootStore';

const { Text, Title } = Typography;

interface CommentState extends MusicCommentPage {
  error: string | null;
  isLoading: boolean;
}

const createCommentState = (): CommentState => ({
  comments: [],
  error: null,
  isLoading: false,
  limit: 20,
  maxPage: 1,
  page: 1,
  total: 0,
});

const renderCommentText = (comment: MusicCommentItem): React.ReactNode => (
  <div className="coral-comment-item">
    <Flex align="flex-start" justify="space-between" gap={12}>
      <div className="coral-comment-user">
        <Text strong ellipsis>
          {comment.userName || '匿名用户'}
        </Text>
        <Space size={8} wrap>
          {comment.timeStr ? <Text type="secondary">{comment.timeStr}</Text> : null}
          {comment.location ? <Text type="secondary">{comment.location}</Text> : null}
        </Space>
      </div>
      {typeof comment.likedCount === 'number' ? (
        <Text type="secondary" className="coral-comment-like">
          <LikeOutlined /> {comment.likedCount}
        </Text>
      ) : null}
    </Flex>
    <p>{comment.text}</p>
    {comment.reply?.length ? (
      <div className="coral-comment-replies">
        {comment.reply.slice(0, 3).map((reply) => (
          <div key={reply.id} className="coral-comment-reply">
            <Text strong>{reply.userName || '匿名用户'}</Text>
            <p>{reply.text}</p>
          </div>
        ))}
      </div>
    ) : null}
  </div>
);

export const MusicCommentPanel = observer(() => {
  const { player } = rootStore;
  const musicInfo = player.displayMusicInfo;
  const [activeKind, setActiveKind] = useState<MusicCommentKind>('hot');
  const [isAvailable, setIsAvailable] = useState(true);
  const [hotComment, setHotComment] = useState<CommentState>(createCommentState);
  const [newComment, setNewComment] = useState<CommentState>(createCommentState);

  const loadComments = useCallback(
    async (kind: MusicCommentKind, page = 1): Promise<void> => {
      if (!musicInfo) return;

      const setState = kind === 'hot' ? setHotComment : setNewComment;
      setState((state) => ({ ...state, error: null, isLoading: true }));

      try {
        const result = await musicCommentService.getComments(musicInfo, kind, page);
        setState((state) => ({
          ...state,
          ...result,
          error: null,
          isLoading: false,
        }));
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        setState((state) => ({
          ...state,
          error: messageText,
          isLoading: false,
        }));
        message.warning(`评论读取失败：${messageText}`);
      }
    },
    [musicInfo],
  );

  useEffect(() => {
    if (!player.isCommentPanelOpen) return;

    let isActive = true;
    setHotComment(createCommentState());
    setNewComment(createCommentState());

    musicCommentService.hasComment(musicInfo).then((hasComment) => {
      if (!isActive) return;
      setIsAvailable(hasComment);
      if (hasComment) loadComments(activeKind, 1);
    });

    return () => {
      isActive = false;
    };
  }, [activeKind, loadComments, musicInfo, player.isCommentPanelOpen]);

  const state = activeKind === 'hot' ? hotComment : newComment;

  const renderList = (): React.ReactNode => {
    if (!isAvailable) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前歌曲暂无评论源" />;
    }

    if (state.error) {
      return (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="评论读取失败">
          <Button
            onClick={() => {
              loadComments(activeKind, state.page);
            }}
          >
            重试
          </Button>
        </Empty>
      );
    }

    return (
      <PlainList
        className="coral-comment-list"
        items={state.comments}
        loading={state.isLoading}
        empty={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无评论" />}
        pagination={
          state.total > state.limit
            ? {
                current: state.page,
                pageSize: state.limit,
                showSizeChanger: false,
                size: 'small',
                total: state.total,
                onChange: (page) => {
                  loadComments(activeKind, page);
                },
              }
            : undefined
        }
        renderItem={(item) => (
          <PlainListItem key={item.id}>
            <PlainListMeta
              avatar={<Avatar icon={<UserOutlined />} src={item.avatar} shape="square" />}
              description={renderCommentText(item)}
            />
          </PlainListItem>
        )}
      />
    );
  };

  return (
    <div className="coral-playdetail-comments">
      <Flex align="center" justify="space-between" className="coral-playdetail-comments-header">
        <div>
          <Text type="secondary">歌曲评论</Text>
          <Title level={5} ellipsis>
            {musicInfo?.name ?? '等待播放'}
          </Title>
        </div>
        <Space size={8}>
          <Button
            aria-label="刷新评论"
            icon={<ReloadOutlined />}
            shape="circle"
            onClick={() => {
              loadComments(activeKind, state.page);
            }}
          />
          <Button
            aria-label="关闭评论"
            icon={<CloseOutlined />}
            shape="circle"
            onClick={() => {
              player.closeCommentPanel();
            }}
          />
        </Space>
      </Flex>
      <Tabs
        activeKey={activeKind}
        className="coral-playdetail-comment-tabs"
        items={[
          { key: 'hot', label: `热门 ${hotComment.total || ''}` },
          { key: 'new', label: `最新 ${newComment.total || ''}` },
        ]}
        onChange={(key) => {
          const kind = key as MusicCommentKind;
          setActiveKind(kind);
          const targetState = kind === 'hot' ? hotComment : newComment;
          if (!targetState.comments.length) loadComments(kind, 1);
        }}
      />
      <div className="coral-playdetail-comments-body">{renderList()}</div>
    </div>
  );
});
