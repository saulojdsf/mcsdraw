interface FilePickerAcceptType {
  description: string;
  accept: Record<string, string[]>;
}

async function showSavePicker(
  suggestedName: string,
  types: FilePickerAcceptType[]
): Promise<FileSystemFileHandle | null> {
  if (!('showSaveFilePicker' in window)) return null;
  try {
    return await (window as Window & { showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
      suggestedName,
      types,
    });
  } catch (e) {
    // User cancelled or API error — fall through to download fallback
    return null;
  }
}

function fallbackDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveBlob(
  blob: Blob,
  filename: string,
  types: FilePickerAcceptType[]
): Promise<void> {
  const handle = await showSavePicker(filename, types);
  if (handle) {
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    fallbackDownload(blob, filename);
  }
}

export async function saveDataUrl(
  dataUrl: string,
  filename: string,
  mimeType: string,
  types: FilePickerAcceptType[]
): Promise<void> {
  const res = await fetch(dataUrl);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  await saveBlob(blob, filename, types);
}
