export async function downloadFile(
  filename: string,
  data: string | Blob,
  type: string,
): Promise<void> {
  const downloads = window.claude ? await window.claude.use('downloads') : null;
  if (downloads) {
    await downloads.save({ filename, data });
    return;
  }
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
