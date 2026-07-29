import { createWriteStream, existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const WEBRTC_TAG = "webrtc-51ef663";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const platformName = process.platform === "win32" ? "win" : process.platform === "darwin" ? "mac" : null;
const architecture = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : null;

if (!platformName || !architecture) {
  throw new Error(`Native LiveKit screen sharing is unsupported on ${process.platform}/${process.arch}`);
}

const triple = `${platformName}-${architecture}-release`;
const cacheRoot = path.join(projectRoot, "src-tauri", "target", "livekit-webrtc");
const sdkPath = path.join(cacheRoot, triple);
const archivePath = path.join(cacheRoot, `webrtc-${triple}.zip`);
const markerPath = path.join(sdkPath, "webrtc.ninja");
const libraryPath = path.join(
  sdkPath,
  "lib",
  process.platform === "win32" ? "webrtc.lib" : "libwebrtc.a",
);

if (!existsSync(markerPath) || !existsSync(libraryPath)) {
  await mkdir(cacheRoot, { recursive: true });
  await rm(sdkPath, { recursive: true, force: true });

  const url = `https://github.com/livekit/rust-sdks/releases/download/${WEBRTC_TAG}/webrtc-${triple}.zip`;
  process.stdout.write(`Downloading LiveKit WebRTC SDK (${triple})...\n`);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Cannot download WebRTC SDK: HTTP ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archivePath));

  // bsdtar is bundled with current Windows and macOS and is considerably
  // faster than PowerShell Expand-Archive for the WebRTC SDK's many headers.
  await execFileAsync("tar", ["-xf", archivePath, "-C", cacheRoot]);
  await rm(archivePath, { force: true });
}

if (!existsSync(markerPath) || !existsSync(libraryPath)) {
  throw new Error(`WebRTC SDK was not extracted correctly: ${sdkPath}`);
}

if (process.argv.includes("--print-path")) process.stdout.write(sdkPath);

export { sdkPath };
