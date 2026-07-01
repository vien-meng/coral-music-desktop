# Coral Music 更新日志

本项目所有重要变更均会记录在此文件中。

版本号遵循 [语义化版本](http://semver.org/)。
提交规范基于 [约定式提交](http://conventionalcommits.org)。
日志格式基于 [Keep a Changelog](http://keepachangelog.com/)。

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
