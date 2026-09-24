# Face Swap Prototype Assets

These are demonstration assets, not user uploads or AI-generated face-swap results.

- `portrait-a.jpg`: https://images.unsplash.com/photo-1534528741775-53994a69daeb
- `portrait-b.jpg`: https://images.unsplash.com/photo-1506794778202-cad84cf45f1d
- `portrait-c.jpg`: https://images.unsplash.com/photo-1544005313-94ddf0286df2
- Portrait usage: https://unsplash.com/license
- `demo.mp4`: locally encoded portrait montage of the three images above, with slight zoom motion; 960x540, 25 FPS, silent.
- `no-faces.mp4`: locally encoded product still using the existing `../prototype/skincare-product.jpg` asset; 960x540, 25 FPS, silent.
- `face-detector.tflite`: Google MediaPipe BlazeFace short-range face detector, float16 revision 1. Source: https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite
- `wasm/`: runtime files from `@mediapipe/tasks-vision@0.10.22-rc.20250304` (Apache-2.0). Source: https://github.com/google-ai-edge/mediapipe

The face detector verifies replacement portraits only. Source-video identity grouping and output encoding remain prototype fixtures. Output downloads contain the full, unmodified source media; they are not real face swaps.
