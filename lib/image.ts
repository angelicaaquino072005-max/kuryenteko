// Helpers for meter photos.
// - "ai" copy: bigger, sent to the reading service.
// - "store" copy: small, kept in browser storage as proof.

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not open this image."));
      el.src = url;
    });
  } finally {
    // the decoded image stays usable after the URL is revoked
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toJpeg(img: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image.");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function prepareImages(blob: Blob): Promise<{ ai: string; store: string }> {
  const img = await loadImage(blob);
  return { ai: toJpeg(img, 1280, 0.82), store: toJpeg(img, 800, 0.65) };
}