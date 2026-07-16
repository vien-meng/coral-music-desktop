# Coral Music 更新日志

本项目所有重要变更均会记录在此文件中。

版本号遵循 [语义化版本](http://semver.org/)。
提交规范基于 [约定式提交](http://conventionalcommits.org)。
日志格式基于 [Keep a Changelog](http://keepachangelog.com/)。


## [1.1.2] - 2026-07-16

设置页 Tab 分区重构，播放器变速进度修复，音乐元数据写入异步化，移除评论功能。

### 新增

- 设置页 Tab 分区：分为常规、播放、下载、网络与服务、快捷键与数据五个标签页，快捷操作自动跳转到对应 Tab
- 播放器 `preservesPitch` 配置：变速播放时保持音高
- 设置保存乐观更新：先合并到本地再异步保存，保存失败自动回滚

### 优化

- 音乐元数据写入改为 Promise：FLAC/MP3 元数据写入使用 `pipeline` 替代手动 pipe，下载完成时 `await setMeta` 确保元数据写入完成后再进入下一步
- 播放器音量值改为 0-1 小数，不再乘 100
- 播放器快照恢复时同步设置音量、静音、播放速率到 runtime
- 下载烟雾测试增强：新增封面图片下载、歌词嵌入、GBK 编码格式测试

### 修复

- 修复 decoded 音频变速后进度计算错误的问题：`decodedPlaybackRate` 独立存储，`decodedPlayStartedAt` 不再减去 offset
- 修复 Seek 后进度跳跃的问题

### 移除

- 移除评论功能：删除 `MusicCommentPanel` 组件、`musicCommentService` 服务及相关状态和方法

## [1.1.1] - 2026-07-05

#### 稳定性修复与调试优化

### 修复

- 修复 超大DSF/DFF 或者特定编码文件扫描时获取不到时长、封面等元数据的问题
- 修复 frameless 透明窗口在特定 Windows 环境（Win11 + RDP）下拖拽时窗口尺寸递增的问题
  - 拖拽开始前调用 `setWindowResizeable(false)` 禁用缩放
  - 每次移动通过 `setBounds` 强制写回原始宽高，阻断 OS 误触 resize
  - 拖拽结束后恢复 `setWindowResizeable(true)`
- 修复文件拖拽导入失效的问题


## [1.1.0] - 2026-07-04

#### 大版本更新，不要错过

DSF/DFF 等需要转码的格式实现流式秒播，大幅降低内存开销，长专辑也能即时播放。

### 新增

- 流式解码播放：DSF/DFF/ALAC/AC3/APE 等超大文件实现秒播
- APE 原生 helper 支持：APE 格式优先使用原生 helper 解码，避免转码开销
- 流式播放 Seek 支持：通过带 startMs/endMs 的请求重新发起流式解码，实现拖动进度条
- 流式 Token 鉴权机制：流式请求使用随机 token，30 分钟过期自动清理

### 优化

- 内存开销大幅降低：转码格式不再需要将整个文件解码到内存，流式按需传输
- 长专辑秒播：无需等待整张专辑转码完成即可开始播放
- WebM 大文件回退：超过 64MB 的 WebM 文件自动走流式解码，避免内存溢出
- DFF 格式指定 `iff` 输入格式提示，提高 FFmpeg 识别成功率
- 流式播放进度计算独立模块化，统一处理 duration/progress 偏移
- 播放列表新增、收藏、下载、删除

### 修复

- 修复流式播放切换歌曲时旧 token 未及时释放的问题
- 修复流式 Seek 后进度计算偏移错误的问题
- 导入歌单自动搜藏到我的收藏
- 新增快捷键设置
- 支持桌面歌词，并且播放控制

## [1.0.3] - 2026-07-02

播放器 UX 优化，新增文件拖拽导入，清理外部解码器遗留 UI，歌曲列表与歌词加载优化。

### 新增

- 文件拖拽导入：支持将本地音频文件/文件夹直接拖入应用窗口进行导入播放
- 拖拽状态视觉反馈，区分文件拖拽与非文件拖拽事件

### 优化

- 本地音频元数据增强：优化采样率/比特率显示问题
- 歌词预加载：切换歌曲时不清空不重载歌词，避免闪烁和重复请求
- 解码期间歌词加载兼容音乐等待状态，防止歌词被吞
- WAV/DTS 兼容：部分 .wav 文件伪装 PCM 头但实际封装 DTS/AC3 编码，避免白噪音
- 本地音频导入流程精简，直接导入到"本地音乐"列表，无需手动选择目标列表
- 封面图片编码改用 btoa，不再依赖 Node.js Buffer
- 首次进入列表页时同步加载歌曲，避免空白页
- 播放器栏和播放详情页移除"配置解码器"按钮（外部解码器已废弃）
- 设置页移除外部解码器相关配置项，界面更加简洁
- 错误提示文案从"外部解码器"统一改为内嵌

### 修复

- 修复歌词状态更新未使用 MobX `runInAction` 导致观察者不响应的问题
- 修复歌曲切换时探针比特率/采样率/格式被旧值覆盖的问题
- 修复独占音频模式初始化失败时 pendingMusic 无法清理的问题

## [1.0.2] - 2026-07-01

内嵌音频解码器升级，移除对外部 FFmpeg 的依赖，直接内置 DSD/SACD 解码能力。

### 新增

- 内嵌 DSD/SACD 音频解码器（.dsf/.dff/.sacd），无需额外安装外部解码程序即可播放
- 暂不支持 SACD ISO 镜像解析
- 扩展本地音频格式支持：APE、TTA、WavPack、AIFF 等无损格式
- 支持 DSD 到 PCM 实时转换，兼容不支持原生 DSD 输出的音频设备

### 优化

- 移除外部 FFmpeg 解码器依赖，简化安装和配置流程
- 本地音频扫描性能优化，大目录扫描速度提升
- 播放器解码链路统一为内部管线，降低进程间通信开销

### 修复

- 修复部分 DSD 文件采样率检测错误的问题
- 修复 SACD ISO 多音轨切换时偶发崩溃的问题

## [1.0.1] - 2026-07-01

样式和主题相关调整。

### 优化

- 调整整体 UI 样式，优化界面视觉一致性
- 优化主题色与暗色/亮色模式下的色彩搭配
- 调整组件间距与布局，提升信息密度与可读性
- 优化字体渲染与图标显示效果

### 修复

- 修复暗色模式下部分文本颜色对比度不足的问题
- 修复主题切换时部分组件未及时响应样式变更的问题

## [1.0.0] - 2026-06-30

基于 lx-music-desktop 2.12.2 的数据结构设计，使用自主架构和全新技术栈（Electron 40 + React 18 + MobX + TypeScript + Vite）完成代码重构。

### 新增

- 全新 React + MobX 架构的渲染层，替换原有的 Vue 渲染层
- 基于 Vite 的开发与构建工具链，替换原有的 webpack 配置
- 完整的 TypeScript 类型系统覆盖（主进程、渲染进程、预加载脚本、Worker）
- 内置 FLAC 无损音频解码器，支持本地 FLAC 文件播放
- 外部解码器（FFmpeg）集成，支持 DSD/SACD/ISO 等格式
- 在线播放页音频参数展示：通过音频文件头探测（Range 请求前 64KB）获取实际采样率与比特率，支持 MP3/FLAC/WAV 格式
- 音质切换功能，支持在线音乐播放时动态切换音质
- 本地音频扫描与播放，支持 MP3/FLAC/WAV/M4A/AAC/OGG/Opus 等格式
- 本地歌词服务，支持与在线歌词匹配和嵌入
- 在线音源管理模块，支持导入/导出/更新自定义音源脚本
- 下载烟雾测试框架，用于验证下载功能的暂停重试、URL 失效刷新等场景
- 开放 API 接口，支持第三方控制播放器
- 同步功能（服务端/客户端模式），支持歌单和黑名单的多设备同步

### 优化

- 用户数据目录强制隔离为 `coral-music-desktop`，避免与原版 lx-music-desktop 数据串用
- IPC 通信层对 MobX observable 对象进行深拷贝序列化，避免 structured clone 失败
- 首次启动数据库初始化时不再打印 `SQLITE_CANTOPEN` 错误日志
- 窗口控制按钮支持 Electron 专有的 `WebkitAppRegion` 拖拽区域属性
- 桌面歌词交互优化，支持触摸事件处理

### 修复

- 修复 antd v5 中 `Divider` 组件 `orientation` 属性语义变更导致的类型错误
- 修复 `parseIntervalSeconds` 函数参数类型不接受 `null` 的问题
- 修复 `getPlayableQualities` 函数参数类型未收窄为在线音乐的问题
- 修复 `WebkitAppRegion` 属性不在 React `CSSProperties` 类型中的问题
- 修复 `getTouchPoint` 函数返回类型未兼容 React `Touch` 的问题
- 修复 `vite-env.d.ts` 中 `Window` 接口声明因模块化导致全局类型扩展失效的问题
- 修复 `userApi` 模块中 `setAllowShowUpdateAlert` 重复导出的问题
- 修复 `preload.js` 中 Promise 执行器返回值触发 ESLint 规则的问题
- 修复 `soundEffect` 模块中 `getStore().get()` 返回类型推断错误
- 修复 `userApi/utils.ts` 中 `electronStore.get()` 返回类型推断错误
- 修复在线音乐切换音质时 MobX observable 对象无法通过 IPC 克隆的问题

### 其他

- 更新 Electron 到 40.9.2
- 项目品牌标识全面替换为 Coral Music（珊瑚音乐）
- 应用协议标识更换为 `coralmusic`，应用 ID 更换为 `cn.coral.music.desktop`
