import { inflateRawSync } from "node:zlib";

export const MAX_XLSX_COMPRESSED_BYTES = 8_000_000;
export const MAX_XLSX_UNCOMPRESSED_BYTES = 64_000_000;
export const MAX_XLSX_ENTRY_BYTES = 32_000_000;
export const MAX_XLSX_ENTRIES = 2_048;
export const MAX_XLSX_COMPRESSION_RATIO = 200;

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const MAX_ZIP_COMMENT_BYTES = 65_535;

export interface XlsxArchiveStats {
  entries: number;
  compressedBytes: number;
  uncompressedBytes: number;
}

interface ZipEntry {
  flags: number;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

function invalidArchive(message: string): never {
  throw new Error(`El archivo XLSX no es seguro: ${message}`);
}

function findEndOfCentralDirectory(view: DataView) {
  const firstPossibleOffset = Math.max(0, view.byteLength - 22 - MAX_ZIP_COMMENT_BYTES);
  for (let offset = view.byteLength - 22; offset >= firstPossibleOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  return invalidArchive("no contiene un directorio ZIP válido.");
}

function compressionRatioExceeded(uncompressedSize: number, compressedSize: number) {
  return uncompressedSize > 0
    && (compressedSize === 0 || uncompressedSize / compressedSize > MAX_XLSX_COMPRESSION_RATIO);
}

function readCentralDirectory(bytes: Uint8Array, view: DataView) {
  const eocdOffset = findEndOfCentralDirectory(view);
  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const commentLength = view.getUint16(eocdOffset + 20, true);

  if (eocdOffset + 22 + commentLength !== bytes.byteLength) {
    invalidArchive("su estructura final es inconsistente.");
  }
  if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== entryCount) {
    invalidArchive("los archivos ZIP multidisco no están permitidos.");
  }
  if (entryCount === 0 || entryCount === 0xffff || centralDirectorySize === 0xffffffff || centralDirectoryOffset === 0xffffffff) {
    invalidArchive("ZIP64 y los archivos vacíos no están permitidos.");
  }
  if (entryCount > MAX_XLSX_ENTRIES) {
    invalidArchive(`contiene más de ${MAX_XLSX_ENTRIES} entradas.`);
  }
  if (centralDirectoryOffset + centralDirectorySize > eocdOffset) {
    invalidArchive("el directorio ZIP está fuera de rango.");
  }

  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;
  let declaredUncompressedBytes = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > eocdOffset || view.getUint32(offset, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      invalidArchive("el directorio ZIP está incompleto.");
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraFieldLength = view.getUint16(offset + 30, true);
    const fileCommentLength = view.getUint16(offset + 32, true);
    const entryDisk = view.getUint16(offset + 34, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nextOffset = offset + 46 + fileNameLength + extraFieldLength + fileCommentLength;

    if (nextOffset > eocdOffset || compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      invalidArchive("contiene una entrada ZIP64 o fuera de rango.");
    }
    if (entryDisk !== 0 || (flags & 0x1) !== 0) {
      invalidArchive("no se permiten entradas cifradas o multidisco.");
    }
    if (compressionMethod !== 0 && compressionMethod !== 8) {
      invalidArchive("usa un método de compresión no permitido.");
    }
    if (uncompressedSize > MAX_XLSX_ENTRY_BYTES) {
      invalidArchive(`una entrada supera ${MAX_XLSX_ENTRY_BYTES / 1_000_000} MB descomprimidos.`);
    }
    if (compressionRatioExceeded(uncompressedSize, compressedSize)) {
      invalidArchive(`una entrada supera la relación de compresión ${MAX_XLSX_COMPRESSION_RATIO}:1.`);
    }

    declaredUncompressedBytes += uncompressedSize;
    if (declaredUncompressedBytes > MAX_XLSX_UNCOMPRESSED_BYTES) {
      invalidArchive(`el contenido supera ${MAX_XLSX_UNCOMPRESSED_BYTES / 1_000_000} MB descomprimidos.`);
    }
    entries.push({ flags, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
    offset = nextOffset;
  }

  if (offset !== centralDirectoryOffset + centralDirectorySize) {
    invalidArchive("el tamaño del directorio ZIP es inconsistente.");
  }
  return entries;
}

function compressedEntryData(bytes: Uint8Array, view: DataView, entry: ZipEntry) {
  const offset = entry.localHeaderOffset;
  if (offset + 30 > bytes.byteLength || view.getUint32(offset, true) !== LOCAL_FILE_SIGNATURE) {
    invalidArchive("una entrada no tiene cabecera local válida.");
  }
  const localFlags = view.getUint16(offset + 6, true);
  const localCompressionMethod = view.getUint16(offset + 8, true);
  const fileNameLength = view.getUint16(offset + 26, true);
  const extraFieldLength = view.getUint16(offset + 28, true);
  const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
  const dataEnd = dataOffset + entry.compressedSize;

  if (localFlags !== entry.flags || localCompressionMethod !== entry.compressionMethod || dataEnd > bytes.byteLength) {
    invalidArchive("una entrada tiene metadatos locales inconsistentes.");
  }
  return bytes.subarray(dataOffset, dataEnd);
}

export function validateXlsxArchive(source: ArrayBuffer | Uint8Array): XlsxArchiveStats {
  const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_XLSX_COMPRESSED_BYTES) {
    invalidArchive(`el archivo comprimido debe medir como máximo ${MAX_XLSX_COMPRESSED_BYTES / 1_000_000} MB.`);
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = readCentralDirectory(bytes, view);
  let actualUncompressedBytes = 0;

  for (const entry of entries) {
    const compressedData = compressedEntryData(bytes, view, entry);
    let actualSize: number;
    try {
      actualSize = entry.compressionMethod === 0
        ? compressedData.byteLength
        : inflateRawSync(compressedData, { maxOutputLength: MAX_XLSX_ENTRY_BYTES }).byteLength;
    } catch {
      return invalidArchive("una entrada excede el límite de descompresión o está dañada.");
    }

    if (actualSize !== entry.uncompressedSize) {
      invalidArchive("una entrada declara un tamaño descomprimido falso.");
    }
    if (compressionRatioExceeded(actualSize, entry.compressedSize)) {
      invalidArchive(`una entrada supera la relación de compresión ${MAX_XLSX_COMPRESSION_RATIO}:1.`);
    }
    actualUncompressedBytes += actualSize;
    if (actualUncompressedBytes > MAX_XLSX_UNCOMPRESSED_BYTES) {
      invalidArchive(`el contenido supera ${MAX_XLSX_UNCOMPRESSED_BYTES / 1_000_000} MB descomprimidos.`);
    }
  }

  return {
    entries: entries.length,
    compressedBytes: bytes.byteLength,
    uncompressedBytes: actualUncompressedBytes
  };
}
