const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PX = 800;
const QUALITY = 0.82;

export class ImageTooLargeError extends Error {}

export async function compressImage(file: File): Promise<string> {
  if (file.size > MAX_RAW_BYTES) {
    throw new ImageTooLargeError(
      `Cette photo est trop lourde (${(file.size / 1024 / 1024).toFixed(0)} Mo, max 10 Mo). Réduis sa taille ou prends une photo directement depuis l'appli.`,
    );
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        } else {
          width = Math.round((width * MAX_PX) / height);
          height = MAX_PX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire cette image.'));
    };

    img.src = url;
  });
}
