#include <algorithm>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "All.h"
#include "MACLib.h"

namespace {

struct Options {
  std::string encodeOutputPath;
  std::string inputPath;
  std::string format = "wav";
  int64_t startMs = 0;
  int64_t endMs = -1;
};

void PrintUsage() {
  std::cerr << "Usage: coral-ape-helper --input <file.ape> --format wav [--start-ms n] [--end-ms n]\n";
}

bool ParseInt64(const char *value, int64_t *out) {
  if (!value || !out) return false;
  char *end = nullptr;
  const long long parsed = std::strtoll(value, &end, 10);
  if (!end || *end != '\0') return false;
  *out = static_cast<int64_t>(parsed);
  return true;
}

bool ParseOptions(int argc, char **argv, Options *options) {
  if (!options) return false;
  for (int i = 1; i < argc; ++i) {
    const std::string arg = argv[i];
    auto requireValue = [&](const char *name) -> const char * {
      if (i + 1 >= argc) {
        std::cerr << "Missing value for " << name << "\n";
        return nullptr;
      }
      return argv[++i];
    };

    if (arg == "--input") {
      const char *value = requireValue("--input");
      if (!value) return false;
      options->inputPath = value;
    } else if (arg == "--format") {
      const char *value = requireValue("--format");
      if (!value) return false;
      options->format = value;
    } else if (arg == "--start-ms") {
      const char *value = requireValue("--start-ms");
      if (!ParseInt64(value, &options->startMs)) return false;
    } else if (arg == "--end-ms") {
      const char *value = requireValue("--end-ms");
      if (!ParseInt64(value, &options->endMs)) return false;
    } else if (arg == "--smoke-encode-wav-to-ape") {
      const char *value = requireValue("--smoke-encode-wav-to-ape");
      if (!value) return false;
      options->encodeOutputPath = value;
    } else if (arg == "--help" || arg == "-h") {
      PrintUsage();
      std::exit(0);
    } else {
      std::cerr << "Unknown argument: " << arg << "\n";
      return false;
    }
  }

  if (options->inputPath.empty()) {
    std::cerr << "--input is required\n";
    return false;
  }
  if (options->format != "wav") {
    std::cerr << "Only --format wav is supported\n";
    return false;
  }
  if (options->startMs < 0 || (options->endMs >= 0 && options->endMs <= options->startMs)) {
    std::cerr << "Invalid --start-ms/--end-ms range\n";
    return false;
  }
  return true;
}

struct ApeDecompressDeleter {
  void operator()(APE::IAPEDecompress *ptr) const {
    delete ptr;
  }
};

struct UtfnDeleter {
  void operator()(APE::str_utfn *ptr) const {
    delete[] ptr;
  }
};

int Fail(const std::string &message, int code = 1) {
  std::cerr << message << "\n";
  return code;
}

std::unique_ptr<APE::str_utfn, UtfnDeleter> Utf8ToUtfn(const std::string &value) {
  return std::unique_ptr<APE::str_utfn, UtfnDeleter>(
      GetUTFNFromUTF8(reinterpret_cast<const APE::str_utf8 *>(value.c_str())));
}

}  // namespace

int main(int argc, char **argv) {
  Options options;
  if (!ParseOptions(argc, argv, &options)) {
    PrintUsage();
    return 2;
  }

  std::unique_ptr<APE::str_utfn, UtfnDeleter> inputPath = Utf8ToUtfn(options.inputPath);
  if (!inputPath) return Fail("Failed to convert input path to UTFN");

  if (!options.encodeOutputPath.empty()) {
#ifdef APE_SUPPORT_COMPRESS
    std::unique_ptr<APE::str_utfn, UtfnDeleter> outputPath = Utf8ToUtfn(options.encodeOutputPath);
    if (!outputPath) return Fail("Failed to convert output path to UTFN");
    const int encodeResult =
        CompressFileW2(inputPath.get(), outputPath.get(), APE_COMPRESSION_LEVEL_FAST, nullptr, 1);
    return encodeResult == ERROR_SUCCESS
               ? 0
               : Fail("Failed to smoke-encode WAV to APE: " + std::to_string(encodeResult), 11);
#else
    return Fail("Smoke encoder was not compiled into this helper", 12);
#endif
  }

  int errorCode = ERROR_SUCCESS;
  std::unique_ptr<APE::IAPEDecompress, ApeDecompressDeleter> decompressor(
      CreateIAPEDecompress(inputPath.get(), &errorCode, true, true, false));
  if (!decompressor || errorCode != ERROR_SUCCESS) {
    return Fail("Failed to open APE file: " + std::to_string(errorCode), 3);
  }

  decompressor->SetNumberOfThreads(1);

  APE::WAVEFORMATEX waveFormat {};
  errorCode = static_cast<int>(
      decompressor->GetInfo(APE::IAPEDecompress::APE_INFO_WAVEFORMATEX,
                            static_cast<APE::int64>(reinterpret_cast<uintptr_t>(&waveFormat))));
  if (errorCode != ERROR_SUCCESS) {
    return Fail("Failed to read APE wave format: " + std::to_string(errorCode), 4);
  }

  const int64_t sampleRate =
      decompressor->GetInfo(APE::IAPEDecompress::APE_INFO_SAMPLE_RATE);
  const int64_t blockAlign =
      decompressor->GetInfo(APE::IAPEDecompress::APE_INFO_BLOCK_ALIGN);
  const int64_t totalBlocks =
      decompressor->GetInfo(APE::IAPEDecompress::APE_DECOMPRESS_TOTAL_BLOCKS);
  if (sampleRate <= 0 || blockAlign <= 0 || totalBlocks <= 0) {
    return Fail("Invalid APE stream information", 5);
  }

  const int64_t startBlock = std::min(totalBlocks, (options.startMs * sampleRate) / 1000);
  const int64_t requestedEndBlock =
      options.endMs >= 0 ? (options.endMs * sampleRate) / 1000 : totalBlocks;
  const int64_t endBlock = std::min(totalBlocks, std::max(startBlock, requestedEndBlock));
  const int64_t blocksToDecode = endBlock - startBlock;
  if (blocksToDecode <= 0) return Fail("Requested APE range is empty", 6);

  errorCode = decompressor->Seek(startBlock);
  if (errorCode != ERROR_SUCCESS) {
    return Fail("Failed to seek APE file: " + std::to_string(errorCode), 7);
  }

  APE::WAVE_HEADER wavHeader {};
  errorCode = FillWaveHeader(&wavHeader, blocksToDecode * blockAlign, &waveFormat);
  if (errorCode != ERROR_SUCCESS) {
    return Fail("Failed to create WAV header: " + std::to_string(errorCode), 8);
  }
  std::cout.write(reinterpret_cast<const char *>(&wavHeader), sizeof(wavHeader));

  constexpr int64_t kBlocksPerRead = 8192;
  std::vector<unsigned char> buffer(static_cast<size_t>(kBlocksPerRead * blockAlign));
  int64_t remainingBlocks = blocksToDecode;
  while (remainingBlocks > 0) {
    const int64_t requestBlocks = std::min<int64_t>(remainingBlocks, kBlocksPerRead);
    int64_t retrievedBlocks = 0;
    errorCode = decompressor->GetData(buffer.data(), requestBlocks, &retrievedBlocks);
    if (errorCode != ERROR_SUCCESS) {
      return Fail("Failed while decoding APE data: " + std::to_string(errorCode), 9);
    }
    if (retrievedBlocks <= 0) break;
    std::cout.write(reinterpret_cast<const char *>(buffer.data()), retrievedBlocks * blockAlign);
    remainingBlocks -= retrievedBlocks;
  }

  std::cout.flush();
  return std::cout.good() ? 0 : 10;
}
