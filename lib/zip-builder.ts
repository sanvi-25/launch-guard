import fs from "fs";
import path from "path";
import zlib from "zlib";

function toDosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function computeCrc32(buf: Buffer): number {
  if (typeof (zlib as any).crc32 === "function") {
    return (zlib as any).crc32(buf);
  }
  // Standard CRC32 table fallback
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function createZipBuffer(rootDir: string): Buffer {
  const filesToZip: { relativePath: string; fullPath: string }[] = [];

  const EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git", ".vercel"]);
  const EXCLUDE_FILES = new Set(["launchguard.zip"]);

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) {
          walk(path.join(currentDir, entry.name));
        }
      } else if (entry.isFile()) {
        if (!EXCLUDE_FILES.has(entry.name)) {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
          filesToZip.push({ relativePath, fullPath });
        }
      }
    }
  }

  walk(rootDir);

  const localHeadersAndData: Buffer[] = [];
  const centralEntries: Buffer[] = [];
  let currentOffset = 0;

  for (const file of filesToZip) {
    const fileContent = fs.readFileSync(file.fullPath);
    const uncompressedSize = fileContent.length;
    const crc = computeCrc32(fileContent);

    // Compress using DEFLATE
    const compressedData = zlib.deflateRawSync(fileContent);
    const compressedSize = compressedData.length;

    const fileNameBuffer = Buffer.from(file.relativePath, "utf8");
    const { time, date } = toDosDateTime(new Date());

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed
    localHeader.writeUInt16LE(0, 6);          // General purpose flags
    localHeader.writeUInt16LE(8, 8);          // Method 8 (DEFLATE)
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(fileNameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);         // Extra field length

    localHeadersAndData.push(localHeader, fileNameBuffer, compressedData);

    // Central directory entry (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central header signature
    centralHeader.writeUInt16LE(20, 4);         // Version made by
    centralHeader.writeUInt16LE(20, 6);         // Version needed
    centralHeader.writeUInt16LE(0, 8);          // General purpose flags
    centralHeader.writeUInt16LE(8, 10);         // Method 8 (DEFLATE)
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(fileNameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);         // Extra field length
    centralHeader.writeUInt16LE(0, 32);         // File comment length
    centralHeader.writeUInt16LE(0, 34);         // Disk number start
    centralHeader.writeUInt16LE(0, 36);         // Internal attributes
    centralHeader.writeUInt32LE(0, 38);         // External attributes
    centralHeader.writeUInt32LE(currentOffset, 42); // Offset of local header

    centralEntries.push(centralHeader, fileNameBuffer);

    currentOffset += localHeader.length + fileNameBuffer.length + compressedData.length;
  }

  const centralDirBuffer = Buffer.concat(centralEntries);
  const centralDirSize = centralDirBuffer.length;
  const centralDirOffset = currentOffset;

  // End of Central Directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);          // EOCD signature
  eocd.writeUInt16LE(0, 4);                   // Disk number
  eocd.writeUInt16LE(0, 6);                   // Start disk
  eocd.writeUInt16LE(filesToZip.length, 8);   // Entries on disk
  eocd.writeUInt16LE(filesToZip.length, 10);  // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);     // Size of central dir
  eocd.writeUInt32LE(centralDirOffset, 16);   // Offset of central dir
  eocd.writeUInt16LE(0, 20);                  // Comment length

  return Buffer.concat([...localHeadersAndData, centralDirBuffer, eocd]);
}
