import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detectorPromise: Promise<FaceDetector> | null = null;

async function withinTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: number;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error("Portrait validation timed out")), 15000); })]);
  } finally { window.clearTimeout(timer!); }
}

function getDetector() {
  if (!detectorPromise) {
    detectorPromise = FilesetResolver.forVisionTasks(new URL("./assets/face-swap/wasm", document.baseURI).href).then((files) => FaceDetector.createFromOptions(files, {
      baseOptions: { modelAssetPath: new URL("./assets/face-swap/face-detector.tflite", document.baseURI).href, delegate: "CPU" },
      runningMode: "IMAGE", minDetectionConfidence: 0.6,
    })).catch((error) => { detectorPromise = null; throw error; });
  }
  return detectorPromise;
}

export async function validateFacePortrait(url: string): Promise<string | null> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = url;
  try { await withinTimeout(image.decode()); } catch { return "图片无法读取，请重新选择。"; }
  try {
    const detector = await withinTimeout(getDetector());
    const faces = detector.detect(image).detections;
    if (!faces.length) return "未识别到清晰人脸，请重新选择单人正面人像。";
    if (faces.length > 1) return "图片包含多张人脸，请重新选择仅有一张人脸的图片。";
    const face = faces[0];
    const box = face.boundingBox;
    if (!box || Math.min(box.width, box.height) < 48 || (face.categories[0]?.score || 0) < 0.75) return "人脸不够清晰，请重新选择清晰的人像图片。";
    // Laplacian variance on a normalized face crop rejects strongly blurred portraits.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "无法校验图片，请重新选择。";
    context.drawImage(image, box.originX, box.originY, box.width, box.height, 0, 0, 128, 128);
    const data = context.getImageData(0, 0, 128, 128).data;
    const gray = (index: number) => 0.299 * data[index * 4] + 0.587 * data[index * 4 + 1] + 0.114 * data[index * 4 + 2];
    let sum = 0, squared = 0, count = 0;
    for (let y = 1; y < 127; y++) for (let x = 1; x < 127; x++) {
      const i = y * 128 + x;
      const value = gray(i - 1) + gray(i + 1) + gray(i - 128) + gray(i + 128) - 4 * gray(i);
      sum += value; squared += value * value; count++;
    }
    if (squared / count - (sum / count) ** 2 < 12) return "人像过于模糊，请重新选择清晰图片。";
    return null;
  } catch { return "人脸校验暂不可用，请稍后重试。"; }
}
