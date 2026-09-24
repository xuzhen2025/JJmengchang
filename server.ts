import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  app.use(express.json());
  const PORT = Number(process.env.PORT) || 3000;

  // Lazy initialize Gemini client
  let ai: GoogleGenAI | null = null;
  const getAiClient = (): GoogleGenAI => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined. AI operations will fall back to mockup responses.");
      }
      ai = new GoogleGenAI({
        apiKey: apiKey || "MOCK_KEY",
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // API Route: Write Premium Prompt for E-commerce AIGC
  app.post("/api/write-prompt", async (req, res) => {
    const { type, shortDescription, style } = req.body;
    if (!shortDescription) {
      return res.status(400).json({ success: false, error: "Missing shortDescription" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback mockup generator when API key is not fully configured yet
      const fallbackPrompt = `${shortDescription}, ${style || "cinematic lighting"}, highly detailed, product shot, commercial advertisement, studio render, 8k resolution, elegant composition, photorealistic, premium material texture --ar 16:9`;
      return res.json({ success: true, prompt: fallbackPrompt });
    }

    try {
      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `你是一个最顶尖的电商AIGC创意总监，专门为Midjourney、Stable Diffusion或视频生成模型（如Veo、Sora）编写专业的画质级Prompt。
请基于以下信息，生成一个非常专业、富有画面感、充满光影质感的电商Prompt。
请尽量输出适合画质生成的中英文混合 Prompt，格式需包含：主体(Subject)、场景细节(Scene details)、光影气氛(Lighting)、构图镜头(Composition)以及电商常用质感词(Texture terms)。

输入信息：
- 工具类型: ${type}
- 产品简述: ${shortDescription}
- 核心风格: ${style || '北欧高奢极简 / 柔和自然光影'}

要求：直接输出生成的完整Prompt字符串，严禁包含任何“好的，这是为您生成的Prompt：”或 markdown 包装标记。直接输出Prompt。`,
      });
      res.json({ success: true, prompt: response.text?.trim() });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite development middleware vs Static Production server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configLoader: "runner",
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
