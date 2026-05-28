import https from "https"

const DEFAULT_API_KEY = "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"

export const getNvidiaApiKey = (): string => {
  return process.env.NVIDIA_API_KEY || DEFAULT_API_KEY
}

const nvidiaHttpPost = (url: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; text: string }> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const postData = JSON.stringify(body)
    const apiKey = getNvidiaApiKey()

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(postData)
      },
      timeout: 180000 // 3 minutes timeout window
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.setEncoding("utf8")
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        resolve({
          ok: (res.statusCode ?? 200) >= 200 && (res.statusCode ?? 200) < 300,
          status: res.statusCode ?? 200,
          text: data
        })
      })
    })

    req.on("error", (e) => {
      reject(e)
    })

    req.on("timeout", () => {
      req.destroy()
      reject(new Error("NVIDIA API request timed out after 3 minutes"))
    })

    req.write(postData)
    req.end()
  })
}

/**
 * Queries NVIDIA's vision model for menu analysis and OCR compliance checks.
 * Uses a multi-tiered cloud model failover logic: Nemotron Reasoning first, falling back to Llama 3.2 Vision.
 */
export async function queryNvidiaVision(
  imageBase64: string,
  mimeType: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const primaryModel = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
  const fallbackModel = "meta/llama-3.2-11b-vision-instruct"

  // Ensure image prefix is present if it isn't already
  const imageSrc = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`

  try {
    console.log(`[NVIDIA Vision] Attempting primary reasoning model: ${primaryModel}`);
    const payload = {
      model: primaryModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageSrc
              }
            },
            {
              type: "text",
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      temperature: 0.1, // Near deterministic for strict OCR/compliance parsing
      top_p: 0.95,
      max_tokens: 16384, // Large token budget to prevent truncation under long reasoning chains
      response_format: { type: "json_object" }, // Forces strictly valid structured JSON output
      extra_body: {
        chat_template_kwargs: {
          enable_thinking: true
        },
        reasoning_budget: 2048 // Limit reasoning budget to leave plenty of room for JSON content
      }
    }

    const res = await nvidiaHttpPost("https://integrate.api.nvidia.com/v1/chat/completions", payload)
    if (!res.ok) {
      throw new Error(`Primary reasoning model failed with HTTP status ${res.status}: ${res.text}`);
    }

    const data = JSON.parse(res.text)
    const content = data.choices?.[0]?.message?.content || ""
    if (!content) {
      throw new Error("Primary reasoning model returned an empty response")
    }

    return content
  } catch (primaryError: unknown) {
    console.warn(`[NVIDIA Vision] Primary reasoning model failed. Falling back to fast standard model: ${fallbackModel}...`, primaryError instanceof Error ? primaryError.message : primaryError);

    const fallbackPayload = {
      model: fallbackModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageSrc
              }
            },
            {
              type: "text",
              text: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        }
      ],
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 4096, // 4k is more than enough for non-thinking model's JSON output
      response_format: { type: "json_object" } // Still enforce clean JSON formatting
    }

    const res = await nvidiaHttpPost("https://integrate.api.nvidia.com/v1/chat/completions", fallbackPayload)
    if (!res.ok) {
      throw new Error(`NVIDIA Vision Fallback API failed with status ${res.status}: ${res.text}`)
    }

    const data = JSON.parse(res.text)
    const content = data.choices?.[0]?.message?.content || ""
    if (!content) {
      throw new Error("NVIDIA Vision Fallback API returned an empty response")
    }

    return content
  }
}

/**
 * Queries NVIDIA's chat completions API for chatbot conversation.
 */
export async function queryNvidiaChat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const modelName = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"

  // Format conversational messages with system prompt at the beginning
  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content
    }))
  ]

  const payload = {
    model: modelName,
    messages: formattedMessages,
    temperature: 0.6,
    top_p: 0.95,
    max_tokens: 16384, // Increased from 4096 to prevent truncation
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: true
      },
      reasoning_budget: 4096 // Increased from 1024 to support deep thinking
    }
  }

  const res = await nvidiaHttpPost("https://integrate.api.nvidia.com/v1/chat/completions", payload)
  if (!res.ok) {
    throw new Error(`NVIDIA Chat API failed with status ${res.status}: ${res.text}`)
  }

  const data = JSON.parse(res.text)
  const content = data.choices?.[0]?.message?.content || ""
  if (!content) {
    throw new Error("NVIDIA Chat API returned an empty response")
  }

  return content
}
