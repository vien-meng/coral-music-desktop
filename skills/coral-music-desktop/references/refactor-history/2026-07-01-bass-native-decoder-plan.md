# BASS Native Decoder Integration Plan

> Date: 2026-07-01

## Goal

珊瑚音乐采用 BASS native + add-ons 作为本地高级格式的完整解码后端。安装包内置所需 helper、BASS core library 与 add-ons，用户安装后无需自行下载 FFmpeg、Foobar2000 或 BASS 插件。

目标覆盖格式：

```text
aac, ape, dff, dsf, flac, it, m4a, m4b, mo3, mod, mp2, mp3, mp4, mpc, mpga, mtm, ogg, opus, s3m, tta, umx, wav, webm, wv, xm
```

## Decision

- 不直接使用 ManagedBass 作为应用内依赖。ManagedBass 是 .NET wrapper，会把 Electron 应用带向额外 .NET runtime/helper 分发问题。
- 使用 BASS native 作为随包解码后端，通过 `coral-bass-decoder` helper 与 Electron 主进程隔离。
- 保留现有 HTMLAudio/WebAudio 系统输出路径，BASS 只负责把不稳定或原生不支持的本地格式解码为临时 WAV，再复用现有播放运行时。
- 保留 FFmpeg/Foobar2000 设置作为诊断/备用路径，但默认 provider 改为 `bass`。

## Runtime Contract

资源目录：

```text
resources/native/bass/<platform>-<arch>/
```

打包后：

```text
<process.resourcesPath>/native/bass/<platform>-<arch>/
```

helper 调用：

```text
coral-bass-decoder --input <source-file> --output <target-wav> --format wav --bass-dir <platform-dir>
```

主进程职责：

- 解析随包 BASS 资源目录；
- 探测 helper、BASS core library 与 add-ons 是否存在；
- 播放本地文件时调用 helper 生成临时 WAV；
- 切歌或退出播放器后沿用现有 decoded file 清理逻辑。

helper 职责：

- 加载 BASS core 和 add-ons；
- 根据输入文件格式选择 BASS stream/music 创建入口；
- 输出 PCM WAV；
- 把失败原因写入 stderr 并返回非 0 exit code。

## Implementation Phases

1. Shared capability layer
   - 增加 `bass` provider；
   - 增加 BASS 完整扩展列表；
   - 默认启用 BASS bundled 解码；
   - 本地解析优先走已启用的 BASS 扩展。

2. Main-process integration
   - 增加 BASS bundle resolver；
   - probe 检查随包 helper/core/add-ons；
   - transcode 分支调用 `coral-bass-decoder`。

3. Packaging
   - `extraResources` 包含 `resources/native`；
   - 添加 native/bass 目录说明；
   - 后续把授权允许分发的 BASS binaries/add-ons 与 helper 放入平台目录。

4. Helper implementation
   - 首选 C/C++ 或 Rust helper，避免引入 .NET runtime；
   - 实现 stream/module 两条路径：普通音频走 BASS stream，tracker/module 走 BASS music；
   - 单元烟测覆盖每类格式至少一个样本。

5. Validation
   - `npm run smoke:playback-capabilities`
   - `npm run typecheck:react`
   - `npm run build:main`
   - 手动播放覆盖：MP3/M4A/WAV/FLAC/DSF/APE/WV/MOD/XM/MO3。

## First Implementation

- Added `bass` to the external decoder provider model.
- Added the requested BASS extension set.
- Changed default settings to enable bundled BASS decoding.
- Added `bassBundledRuntime` for packaged resource discovery.
- Extended external decoder probe/runtime to support the bundled BASS helper.
- Updated Settings UI to show `内置 BASS` and hide manual path/plugin fields for that mode.
- Added packaging rule for `resources/native`.
- Added `resources/native/bass/README.md` with the exact helper/resource contract.

## Risks

- BASS binaries and add-ons must only be bundled after the project confirms redistribution/licensing terms for the release channel.
- The helper executable is a required follow-up artifact; until present, probe/playback will report a clear missing-resource error.
- Some module formats may need BASS music-specific flags rather than stream decoding.
