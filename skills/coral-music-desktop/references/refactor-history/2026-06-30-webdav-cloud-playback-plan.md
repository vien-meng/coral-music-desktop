# WebDAV 网盘资源播放与下载支持计划

Date: 2026-06-30

## Summary

第一版只支持用户提供的 WebDAV 端点，不接各网盘官方 API。百度网盘、迅雷云盘、夸克网盘、阿里云盘、115、天意/天翼云盘、UC 网盘作为连接预设和展示入口；只要用户提供可用 WebDAV 地址、账号和密码/Token，就能浏览、播放和下载音频文件。

## Key Changes

- 新增 WebDAV 账号管理：名称、预设平台、服务器地址、用户名、密码/Token、根目录、备注，支持新增、编辑、删除、启用/禁用和测试连接。
- 新增 WebDAV 文件浏览页：目录面包屑、返回上级、刷新、当前目录搜索、音频过滤，音频支持 `mp3/flac/wav/m4a/aac/ogg/opus`。
- WebDAV 文件转换为 `MusicInfoWebDav`，`source` 使用 `webdav`；播放不直连远端地址，而是由主进程生成短期本地代理 URL 并带鉴权转发，支持 `Range`。
- WebDAV 下载复用现有下载任务 UI 和状态机，下载文件名保留远程文件名和扩展名，不走在线音质降级。

## Public Interfaces / Types

- 新增 `Coral.WebDav.Provider`、`Coral.WebDav.Account`、`Coral.WebDav.FileItem`。
- 新增 `Coral.Music.MusicInfoWebDav` 并纳入 `Coral.Music.MusicInfo`。
- 新增设置项：`webdav.accounts`、`webdav.activeAccountId`、`webdav.proxy.enabled`。
- 新增 IPC：`webdav_account_list/save/remove/test`、`webdav_list_dir`、`webdav_create_stream_url`、`webdav_revoke_stream_url`。
- 新增主进程 `webDavService`，负责 PROPFIND、GET/HEAD、Range 转发、鉴权和错误归一化。

## Test Plan

- 添加 WebDAV 账号后测试连接成功；错误地址/账号显示明确错误。
- 能浏览根目录和子目录，面包屑、刷新、当前目录搜索可用。
- WebDAV MP3/FLAC 可播放，拖动进度条时 Range 请求正常，不触发 User API 或在线音质切换。
- WebDAV 音频可创建下载任务并自动下载，文件名和扩展名正确，暂停/继续/失败重试沿用现有下载行为。
- 验证命令：`npm run typecheck:react`、`npx tsc -p src/main/tsconfig.json --noEmit --pretty false`、`npm run build:renderer`、`npm run build:main`。

## Assumptions

- 第一版不内置任何网盘官方 OAuth/API，只接用户可用的 WebDAV 服务。
- 网盘名称只作为中文预设和连接说明；应用不负责自动生成第三方 WebDAV 桥接端点。
- WebDAV 资源按远程文件处理，不参与在线平台音质切换、User API 取链、在线歌词/封面逻辑。
