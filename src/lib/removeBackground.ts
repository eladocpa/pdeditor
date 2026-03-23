/**
 * Removes white/light background from an image, making it transparent.
 * Uses canvas pixel manipulation with configurable threshold.
 */
export function removeBackground(
  dataUrl: string,
  threshold: number = 235
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is white/near-white/light gray
        if (r >= threshold && g >= threshold && b >= threshold) {
          // Make fully transparent
          data[i + 3] = 0;
        } else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
          // Semi-transparent for near-threshold pixels (smooth edges)
          const avg = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, (threshold - avg + 20) * (255 / 40)));
          data[i + 3] = Math.min(data[i + 3], Math.round(alpha));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
