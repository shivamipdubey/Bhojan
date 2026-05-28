import { getDemoScanForTradition } from "@/lib/demo-data"
import http from "http"

const httpPost = (url: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; text: string }> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(body);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 600000 // 10 minutes timeout window
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          ok: (res.statusCode ?? 200) >= 200 && (res.statusCode ?? 200) < 300,
          status: res.statusCode ?? 200,
          text: data
        });
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Local Ollama request timed out after 10 minutes"));
    });

    req.write(postData);
    req.end();
  });
};

import { getVisionModel } from "@/lib/gemini"
import { queryNvidiaVision } from "@/lib/nvidia"
import { COMPLIANCE_SYSTEM_PROMPT } from "@/lib/prompts"
import { normalizeProfile } from "@/lib/profile"
import { validateScanResult } from "@/lib/rules-engine"
import { createClient } from "@/lib/supabase/server"
import type { ScanResult } from "@/types"
import { NextResponse } from "next/server"

type ScanBody = {
  imageBase64?: string
  mimeType?: string
  demo?: boolean
  profile?: {
    tradition?: string
    subTradition?: string | null
    strictness?: string
    allergies?: string[]
    dislikes?: string[]
    activeObservances?: string[]
  }
}

interface OllamaModel {
  name: string
  priority: number
}

const cleanJson = (text: string) => text.replace(/```json|```/g, "").trim()

export async function POST(request: Request) {
  const body = (await request.json()) as ScanBody
  const normalized = normalizeProfile({
    tradition: body.profile?.tradition === "custom" ||
      body.profile?.tradition === "satvik" ||
      body.profile?.tradition === "jain" ||
      body.profile?.tradition === "halal" ||
      body.profile?.tradition === "kosher" ||
      body.profile?.tradition === "christian"
      ? body.profile.tradition
      : undefined,
    subTradition: body.profile?.subTradition,
    strictness:
      body.profile?.strictness === "standard" ||
        body.profile?.strictness === "strict" ||
        body.profile?.strictness === "festival"
        ? body.profile.strictness
        : undefined,
    allergies: body.profile?.allergies,
    dislikes: body.profile?.dislikes
  })
  const profile = { ...normalized, activeObservances: body.profile?.activeObservances ?? ["Ekadashi"] }

  if (body.demo) {
    return NextResponse.json(validateScanResult(getDemoScanForTradition(profile.tradition), profile))
  }

  if (!body.imageBase64 || !body.mimeType) {
    return NextResponse.json({ error: "Missing image base64 or mimeType data." }, { status: 400 })
  }

  const userPrompt = `Analyze this menu for ${profile.tradition} dietary compliance.
Sub-tradition: ${profile.subTradition ?? "none"}.
Strictness: ${profile.strictness}.
User allergies: ${(profile.allergies ?? []).join(", ") || "none"}.
User dislikes: ${(profile.dislikes ?? []).join(", ") || "none"}.
Active observances: ${(profile.activeObservances ?? []).join(", ") || "none"}.
Return JSON only. No markdown. No explanation outside the JSON.`

  try {
    console.log("Attempting NVIDIA vision API primary cloud query...");
    const nvidiaResult = await queryNvidiaVision(
      body.imageBase64,
      body.mimeType,
      COMPLIANCE_SYSTEM_PROMPT,
      userPrompt
    )

    const parsed = JSON.parse(cleanJson(nvidiaResult)) as ScanResult
    const validated = validateScanResult(parsed, profile)

    try {
      const supabase = await createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("scans").insert({
          id: validated.scanId,
          user_id: user.id,
          restaurant_name: validated.restaurant,
          tradition: profile.tradition,
          scan_result: validated
        })
      }
    } catch {
      // Scan results should still render if history persistence is unavailable.
    }

    return NextResponse.json(validated)
  } catch (nvidiaError: unknown) {
    console.warn("NVIDIA vision API failed. Attempting cloud Gemini fallback...", nvidiaError);

    try {
      const model = getVisionModel()
      const result = await model.generateContent([
        COMPLIANCE_SYSTEM_PROMPT,
        {
          inlineData: {
            data: body.imageBase64,
            mimeType: body.mimeType
          }
        },
        userPrompt
      ])

      const parsed = JSON.parse(cleanJson(result.response.text())) as ScanResult
      const validated = validateScanResult(parsed, profile)

      try {
        const supabase = await createClient()
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from("scans").insert({
            id: validated.scanId,
            user_id: user.id,
            restaurant_name: validated.restaurant,
            tradition: profile.tradition,
            scan_result: validated
          })
        }
      } catch {
        // Scan results should still render if history persistence is unavailable.
      }

      return NextResponse.json(validated)
    } catch (geminiError: unknown) {
      console.warn("Gemini vision API failed. Attempting local Ollama fallback...", geminiError);

    try {
      // 1. Fetch available models from Ollama to check connectivity
      const tagsRes = await fetch("http://localhost:11434/api/tags").catch(() => null);
      if (!tagsRes) {
        throw new Error(
          "Ollama is offline. Start the Ollama app and pull a fast vision model (e.g. 'ollama run moondream' or 'ollama run llama3.2-vision:3b') to enable offline scanning."
        );
      }

      const tagsData: { models?: Array<{ name: string }> } = await tagsRes.json().catch(() => ({ models: [] }));
      const models = tagsData.models || [];

      // 2. Dynamically search for a local model with vision capabilities, prioritizing high-quality models first
      const visionModels = models
        .filter((m: { name: string }) =>
          m.name.includes("vision") ||
          m.name.includes("llava") ||
          m.name.includes("moondream") ||
          m.name.includes("vl")
        )
        .map((m: { name: string }): OllamaModel => {
          let priority = 5; // Default priority
          const nameLower = m.name.toLowerCase();
          // Prioritize llama3.2-vision (both 11b and 3b) for excellent, high-quality menu parsing
          if (nameLower.includes("llama3.2-vision") || nameLower.includes("llama3.2-vision:11b")) {
            priority = 10; // Best quality & highly accurate
          } else if (nameLower.includes("llama3.2-vision:3b")) {
            priority = 9;  // Great quality & very fast
          } else if (nameLower.includes("llava")) {
            priority = 7;  // Good standard fallback
          } else if (nameLower.includes("moondream")) {
            priority = 4;  // Lightweight but low-quality text parsing fallback
          }
          return { name: m.name, priority };
        })
        .sort((a, b) => b.priority - a.priority);

      const foundModel = visionModels[0];

      if (!foundModel) {
        throw new Error(
          "No local vision-capable model found in Ollama. Please run 'ollama run llama3.2-vision:11b' in your terminal for accurate offline scanning."
        );
      }

      const selectedModel = foundModel.name;
      console.log(`Local vision model found: ${selectedModel} (Quality/Speed Priority: ${foundModel.priority}). Initiating scan...`);

      // 3. Query Ollama Chat API with image and structured JSON format using native httpPost (no headers timeout limits)
      const ollamaRes = await httpPost("http://localhost:11434/api/chat", {
        model: selectedModel,
        messages: [
          {
            role: "user",
            content: `${COMPLIANCE_SYSTEM_PROMPT}\n\nAnalyze this menu for ${profile.tradition} dietary compliance.
Sub-tradition: ${profile.subTradition ?? "none"}.
Strictness: ${profile.strictness}.
User allergies: ${(profile.allergies ?? []).join(", ") || "none"}.
User dislikes: ${(profile.dislikes ?? []).join(", ") || "none"}.
Active observances: ${(profile.activeObservances ?? []).join(", ") || "none"}.
Return JSON only. No markdown. No explanation outside the JSON.`,
            images: [body.imageBase64]
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.0,
          seed: 42
        }
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama vision request failed with HTTP status ${ollamaRes.status}.`);
      }

      const ollamaData = JSON.parse(ollamaRes.text);
      const responseText = ollamaData.message?.content || "";
      if (!responseText) {
        throw new Error("Ollama returned an empty response.");
      }

      const parsed = JSON.parse(responseText.trim()) as ScanResult;
      const validated = validateScanResult(parsed, profile);

      // Save scan to database if user is logged in
      try {
        const supabase = await createClient()
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (user) {
          await supabase.from("scans").insert({
            id: validated.scanId,
            user_id: user.id,
            restaurant_name: validated.restaurant,
            tradition: profile.tradition,
            scan_result: validated
          })
        }
      } catch {
        // Scan results should still render if history persistence is unavailable.
      }

      return NextResponse.json(validated);
    } catch (ollamaError: unknown) {
      console.error("Local Ollama fallback failed:", ollamaError);

      const message = ollamaError instanceof Error ? ollamaError.message : "Unknown error."
      const detailedErrorMessage =
        `Gemini API limit reached (Quota Exceeded). Local Ollama fallback also failed: ${message}`;

      return NextResponse.json(
        { error: detailedErrorMessage },
        { status: 429 }
      );
    }
  }
}
}
