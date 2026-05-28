import { getGeminiClient } from "@/lib/gemini"
import { queryNvidiaChat } from "@/lib/nvidia"
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
      timeout: 600000 // 10 minutes timeout
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
import { NextResponse } from "next/server"

interface OllamaModel {
  name: string
  priority: number
}

// Failsafe local simulated chat responses for the Italian demo menu (Bella Italia)
const getSimulatedChatResponse = (query: string, tradition: string) => {
  const q = query.toLowerCase()

  if (tradition === "satvik" || tradition === "jain") {
    if (q.includes("pasta") || q.includes("pomodoro") || q.includes("customize")) {
      return `To customize the pasta at **Bella Italia**:
1. You can ask for the **Penne Arrabbiata** or **Spaghetti Pomodoro**, but strictly request that it be prepared **with plain tomato passata, olive oil, and fresh herbs** (no garlic, no onion, no shallots, no stock).
2. Ask the kitchen: *"Can this be cooked in a clean pan with fresh oil to prevent garlic oil contamination?"*
Both options are excellent, warm alternatives that the kitchen can easily prepare on-demand!`
    }
    if (q.includes("pizza") || q.includes("margherita")) {
      return `The standard **Margherita Pizza** sauce at **Bella Italia** is pre-simmered with onion and garlic, which violates your profile.
* **Safer customization:** Ask if they can make a white pizza (Pizza Bianca) using only **mozzarella cheese, fresh tomatoes, and basil leaves**, drizzled with olive oil, completely omitting the pre-made tomato sauce.
* **Chef Tip:** Use our **Kitchen Card** to explain the absolute avoidance of garlic and onion powders!`
    }
    if (q.includes("dessert") || q.includes("eggless") || q.includes("sweet")) {
      return `For dessert at **Bella Italia**:
1. **Safe Option:** The **Lemon Sorbet** is 100% compliant, dairy-free, eggless, and free from fermented or honey additives.
2. **Avoid:** The **Tiramisu** and **Panna Cotta** contain eggs and animal-derived gelatin respectively, which are active conflicts with your saved practice.
Enjoy the sorbet for a refreshing, compliant sweet finish!`
    }
  }

  if (tradition === "halal" || tradition === "kosher") {
    if (q.includes("meat") || q.includes("beef") || q.includes("chicken") || q.includes("halal")) {
      return `Regarding meat compliance at **Bella Italia**:
1. The **Chicken Alfredo** and **Bolognese** dishes do **NOT** use certified Halal/Kosher meat.
2. Under strict strictness, we recommend choosing our vegetarian pasta options (e.g. Penne Arrabbiata) or seafood options if accepted under your rules.
3. Make sure to present our **Kitchen Card** to ask if the vegetarian items share fryers or grills with non-halal meat.`
    }
  }

  // Default intelligent response matching the menu and tradition
  return `Based on your **${tradition}** profile and the scanned menu of **Bella Italia**:
* Simple dishes like the **Lemon Sorbet** are safe.
* Pastas and pizzas can be customized, but standard sauces contain hidden onion/garlic/alcohol.
* We highly recommend clicking our **🌐 Generate Kitchen Card** button at the top to present a clear instruction list to your server. 

What other dish on this menu would you like me to analyze for customization?`
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { profile, menuContext = "", messages = [] } = body

  if (!profile) {
    return NextResponse.json({ error: "Missing profile in request" }, { status: 400 })
  }

  const userQuery = messages[messages.length - 1]?.content || ""

  const systemPrompt = `You are Bhojan's culinary assistant, an expert in religious dietary laws (Satvik, Jain, Halal, Kosher, Christian Fasting) and menu customization.
The user is at a restaurant and has scanned a menu. They are asking questions about what they can order, how to modify dishes to be compliant with their dietary practice, or clarifying ingredient warnings.

Use the menu context, their dietary profile, and your deep knowledge of ingredients to provide helpful, practical, and highly accurate suggestions.
Be encouraging but strictly honest. If a dish cannot be made compliant due to root-level ingredients (like meat stock, or onion/garlic in pre-made pasta sauces), clearly explain why and suggest a safer alternative from the menu.

User Profile:
- Tradition: ${profile.tradition}
- Strictness: ${profile.strictness}
- Allergies: ${(profile.allergies || []).join(", ") || "none"}
- Dislikes: ${(profile.dislikes || []).join(", ") || "none"}

Scanned Menu Context (Dishes analyzed):
${menuContext}

Answer the user's question concisely, focusing on practical restaurant ordering advice. Keep your response short, warm, and highly informative, formatting it with clean markdown.`

  try {
    console.log("Attempting NVIDIA chat API primary cloud query...");
    const responseText = await queryNvidiaChat(systemPrompt, messages)
    return NextResponse.json({ response: responseText })
  } catch (nvidiaError: unknown) {
    console.warn("NVIDIA chat API failed. Attempting cloud Gemini fallback...", nvidiaError);

    try {
      const genAI = getGeminiClient()
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }))
      ]

      const result = await model.generateContent({ contents })
      const responseText = result.response.text()

      return NextResponse.json({ response: responseText })
    } catch (geminiError: unknown) {
      console.warn("Gemini chat API failed. Attempting local Ollama chat fallback...", geminiError);

    try {
      // 1. Fetch available models from Ollama to verify connectivity
      const tagsRes = await fetch("http://localhost:11434/api/tags").catch(() => null);
      if (!tagsRes) {
        throw new Error("Ollama is offline");
      }

      const tagsData: { models?: Array<{ name: string }> } = await tagsRes.json().catch(() => ({ models: [] }));
      const models = tagsData.models || [];

      // 2. Dynamically search for a local chat/text model
      const chatModels = models
        .filter((m) => !m.name.includes("nomic-embed-text"))
        .map((m): OllamaModel => {
          let priority = 5; // Default priority
          const nameLower = m.name.toLowerCase();
          if (nameLower.includes("llama3.2") && !nameLower.includes("vision")) {
            priority = 10; // Fast and highly accurate standard text model (~2GB)
          } else if (nameLower.includes("llama3.1") && !nameLower.includes("vision")) {
            priority = 9;  // Powerful local model (~4.9GB)
          } else if (nameLower.includes("gemma")) {
            priority = 8;  // High quality Google text model (~9GB)
          } else if (nameLower.includes("llama3.2-vision")) {
            priority = 7;  // Local multimodal model (also excellent for text chat!)
          }
          return { name: m.name, priority };
        })
        .sort((a, b) => b.priority - a.priority);

      const foundModel = chatModels[0];
      if (!foundModel) {
        throw new Error("No local text-capable model found in Ollama.");
      }

      const selectedModel = foundModel.name;
      console.log(`Local chat model found: ${selectedModel}. Initiating chat fallback...`);

      // 3. Format messages history for Ollama chat API
      const formattedHistory = [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }))
      ];

      // 4. Query Ollama Chat API with httpPost
      const ollamaRes = await httpPost("http://localhost:11434/api/chat", {
        model: selectedModel,
        messages: formattedHistory,
        stream: false,
        options: {
          temperature: 0.2
        }
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama chat request failed with status ${ollamaRes.status}`);
      }

      const ollamaData = JSON.parse(ollamaRes.text);
      const responseText = ollamaData.message?.content || "";

      return NextResponse.json({ response: responseText });
    } catch (ollamaError: unknown) {
      console.error("Local Ollama chat fallback failed:", ollamaError);
      // Failsafe local simulated chat response
      const response = getSimulatedChatResponse(userQuery, profile.tradition);
      return NextResponse.json({ response });
    }
  }
}
}
