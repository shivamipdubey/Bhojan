import { getGeminiClient } from "@/lib/gemini"
import { queryNvidiaChat } from "@/lib/nvidia"
import { TRADITION_LABELS } from "@/types"
import { NextResponse } from "next/server"

const cleanJson = (text: string) => text.replace(/```json|```/g, "").trim()

// Failsafe local offline translation template library
interface FallbackProfile {
  tradition: string
  traditions?: string[]
  strictness: string
  allergies?: string[]
  dislikes?: string[]
}

const getLocalFallbackCard = (profile: FallbackProfile, language: string) => {
  const traditionsList = profile.traditions || [profile.tradition]
  const traditionLabel = traditionsList.map(t => TRADITION_LABELS[t as keyof typeof TRADITION_LABELS] || t).join(" + ")
  const allergies = (profile.allergies || []).join(", ") || "None"
  const dislikes = (profile.dislikes || []).join(", ") || "None"

  // Standard pre-translated templates for common traditions in main languages
  const translations: Record<string, { title: string; content: string }> = {
    Italian: {
      title: "Restrizioni Alimentari Importanti (Carta dello Chef)",
      content: `• Pratica alimentare: ${traditionLabel} (${profile.strictness})\n• ALLERGIE SEVERE: ${allergies}\n• Ingredienti da evitare assolutamente: ${dislikes}\n• Si prega di verificare che salse, condimenti e brodi non contengano questi ingredienti.\n• Si prega di evitare la contaminazione incrociata usando utensili e padelle pulite.`
    },
    Japanese: {
      title: "重要な食事制限について (シェフへの伝言板)",
      content: `• 食事の主義・習慣: ${traditionLabel} (${profile.strictness})\n• 重度のアレルギー: ${allergies}\n• 避けるべき食材: ${dislikes}\n• ソース、調味料、ダシ汁等にこれらの食材が含まれていないかご確認ください。\n• 調理器具やフライパン等は洗浄された清潔なものを使用し、混入（コンタミネーション）を防ぐようお願いいたします。`
    },
    Spanish: {
      title: "Restricciones Alimentarias Importantes (Carta del Chef)",
      content: `• Práctica alimentaria: ${traditionLabel} (${profile.strictness})\n• ALERGIAS GRAVES: ${allergies}\n• Evitar por completo: ${dislikes}\n• Por favor, compruebe que las salsas, caldos y sazones no contengan estos ingredientes.\n• Evite la contaminación cruzada utilizando sartenes y utensilios limpios.`
    },
    French: {
      title: "Restrictions Alimentaires Importantes (Note pour le Chef)",
      content: `• Pratique alimentaire: ${traditionLabel} (${profile.strictness})\n• ALLERGIES GRAVES: ${allergies}\n• Ingrédients à éviter absolument: ${dislikes}\n• Veuillez vérifier que les sauces, bouillons et assaisonnements ne contiennent pas ces ingrédients.\n• Évitez la contamination croisée en utilisant des ustensiles et poêles propres.`
    },
    Thai: {
      title: "ข้อมูลข้อจำกัดด้านอาหารที่สำคัญ (การแจ้งเตือนสำหรับเชฟ)",
      content: `• ข้อกำหนดด้านศาสนา/อาหาร: ${traditionLabel} (${profile.strictness})\n• อาการแพ้อาหารที่รุนแรง: ${allergies}\n• ส่วนผสมที่ต้องหลีกเลี่ยงอย่างเด็ดขาด: ${dislikes}\n• โปรดตรวจสอบว่าน้ำซอส เครื่องปรุงรส และน้ำซุปไม่มีส่วนผสมเหล่านี้\n• โปรดหลีกเลี่ยงการปนเปื้อนข้ามโดยใช้ภาชนะและกระทะที่สะอาด`
    },
    Hindi: {
      title: "महत्वपूर्ण आहार प्रतिबंध (शेफ के लिए निर्देश)",
      content: `• धार्मिक/आहार पद्धति: ${traditionLabel} (${profile.strictness})\n• गंभीर एलर्जी: ${allergies}\n• वर्जित सामग्रियां: ${dislikes}\n• कृपया सुनिश्चित करें कि सॉस, ग्रेवी या मसाले में ये सामग्रियां न हों।\n• कृपया अलग बर्तनों और साफ कड़ाही का उपयोग करके क्रॉस-कंटैमिनेशन से बचाएं।`
    }
  }

  const selected = translations[language] || {
    title: "Important Dietary Restrictions (Chef Card)",
    content: `• Practice: ${traditionLabel} (${profile.strictness})\n• SEVERE ALLERGIES: ${allergies}\n• Strictly Avoid: ${dislikes}\n• Please verify that sauces, stocks, and seasonings do not hide these items.\n• Prevent cross-contamination by using clean pans and utensils.`
  }

  return {
    translatedTitle: selected.title,
    translatedContent: selected.content,
    englishContent: `• Practice: ${traditionLabel} (${profile.strictness})\n• SEVERE ALLERGIES: ${allergies}\n• Strictly Avoid: ${dislikes}\n• Please verify that sauces, stocks, and seasonings do not hide these items.\n• Prevent cross-contamination by using clean pans and utensils.`
  }
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { profile, targetLanguage = "English" } = body

  if (!profile) {
    return NextResponse.json({ error: "Missing profile in request" }, { status: 400 })
  }

  const prompt = `You are Bhojan's culinary translation engine.
Your job is to generate a professional, highly respectful, and clear "Kitchen Alert Card" (dietary restriction card) in the target foreign language (${targetLanguage}) for the restaurant's head chef and kitchen staff.

The user's dietary parameters:
- Traditions/Dietary Laws: ${profile.traditions ? profile.traditions.join(" + ") : profile.tradition}
- Strictness: ${profile.strictness}
- Allergies: ${(profile.allergies || []).join(", ") || "none"}
- Avoided Ingredients: ${(profile.dislikes || []).join(", ") || "none"}

Please translate this practice and set of restrictions into a highly professional list of instructions in ${targetLanguage}.
List explicitly the forbidden ingredients. Use direct, polite language suitable for professional chefs. Highlight severe allergies.
Include warnings about cross-contamination (e.g. not using shared fryers or cooking surfaces with meat/pork/alliums if applicable).

Return a JSON object with this exact structure (no markdown, no backticks, raw JSON only):
{
  "translatedTitle": "Card title in ${targetLanguage} (e.g., 'Important Dietary Restrictions' translated)",
  "translatedContent": "Detailed bullet-point instructions in ${targetLanguage} explaining exactly what ingredients cannot be eaten, highlighting the allergies as severe. Ensure standard warning symbols like ⚠️ or 🚫 are used where relevant.",
  "englishContent": "The exact English translation of the card content so the user knows what they are presenting."
}`

  try {
    console.log("Attempting NVIDIA translation API primary cloud query...");
    const nvidiaRes = await queryNvidiaChat(prompt, [])
    const parsed = JSON.parse(cleanJson(nvidiaRes))
    return NextResponse.json(parsed)
  } catch (nvidiaError: unknown) {
    console.warn("NVIDIA translation API failed. Attempting cloud Gemini fallback...", nvidiaError);

    try {
      const genAI = getGeminiClient()
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

      const result = await model.generateContent([prompt])
      const responseText = result.response.text()
      
      const parsed = JSON.parse(cleanJson(responseText))
      return NextResponse.json(parsed)
    } catch (geminiError: unknown) {
      console.warn("Gemini translation API failed. Attempting local fallback template...", geminiError);
      // Graceful fallback to pre-translated offline template if Gemini/NVIDIA fails or is offline
      const fallback = getLocalFallbackCard(profile, targetLanguage)
      return NextResponse.json(fallback)
    }
  }
}
