const MAX_RAW_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PX = 720;
const QUALITY = 0.74;

export class ImageTooLargeError extends Error {}
export class ImageUnsupportedError extends Error {}

function isHeicLike(file: File) {
  const name = file.name.toLowerCase();
  return file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif');
}

async function normalizeFile(file: File): Promise<Blob> {
  if (!isHeicLike(file)) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8,
    });

    return Array.isArray(converted) ? converted[0] : converted;
  } catch {
    throw new ImageUnsupportedError(
      'Cette photo HEIC/HEIF ne peut pas être lue ici. Essaie de la reprendre depuis l’appareil photo ou de l’envoyer en JPG/PNG.',
    );
  }
}

export async function compressImage(file: File): Promise<string> {
  if (file.size > MAX_RAW_BYTES) {
    throw new ImageTooLargeError(
      `Cette photo est trop lourde (${(file.size / 1024 / 1024).toFixed(0)} Mo, max 10 Mo). Réduis sa taille ou prends une photo directement depuis l'appli.`,
    );
  }

  const readableFile = await normalizeFile(file);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(readableFile);
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
      reject(new ImageUnsupportedError('Impossible de lire cette image. Essaie une photo JPG, PNG ou une prise directe depuis l’appareil photo.'));
    };

    img.src = url;
  });
}
