export function downloadBlobFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Delay revocation so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

