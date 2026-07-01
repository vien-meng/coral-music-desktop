# Bundled BASS Runtime

珊瑚音乐的内置 BASS 解码模式从此目录加载 native helper、BASS core library 与 add-ons。
这些文件会通过 `build-config/build-pack.js` 的 `extraResources` 打进安装包，运行时路径为：

```text
<process.resourcesPath>/native/bass/<platform>-<arch>/
```

开发环境路径为：

```text
resources/native/bass/<platform>-<arch>/
```

## Platform Directories

当前代码按以下目录名解析：

- `win32-x64`
- `win32-x86`
- `win32-arm64`
- `darwin-x64`
- `darwin-arm64`
- `linux-x64`
- `linux-arm64`

## Required Files

每个平台目录都需要包含：

- `coral-bass-decoder` helper，可执行文件。Windows 使用 `coral-bass-decoder.exe`。
- BASS core library：Windows `bass.dll`，macOS `libbass.dylib`，Linux `libbass.so`。
- BASS add-ons：
  - AAC/MP4/M4A/M4B：`bass_aac`
  - APE：`bassape`
  - DSD/DSF/DFF：`bassdsd`
  - FLAC：`bassflac`
  - MPC：`bass_mpc`
  - Opus：`bassopus`
  - TTA：`basstta`
  - WebM：`basswebm`
  - WavPack：`basswv`

## Helper Protocol

The helper is invoked by the main process as:

```text
coral-bass-decoder --input <source-file> --output <target-wav> --format wav --bass-dir <platform-dir>
```

It must:

- load BASS and add-ons from `--bass-dir` or `CORAL_BASS_DIR`;
- decode the source file to PCM WAV;
- write the output file atomically enough that it exists and is readable when the process exits with code `0`;
- write human-readable errors to stderr and use a non-zero exit code on failure.

## Licensing

BASS and add-ons are not Apache-2.0 project source. Only add redistributable binaries here after the project has confirmed the Un4seen BASS license terms for the release channel.
