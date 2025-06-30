import { GoogleGenAI, GenerateContentResponse, Chat } from '@google/genai'
import { SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION } from '../constants'
import { SourceMaterialPart, ChatMessage } from '../types'

class GeminiService {
  private getAi(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey })
  }

  private convertSourceToParts(source: SourceMaterialPart[]) {
    const geminiParts = source.map((part) => {
      if (part.type === 'image' && part.mimeType) {
        return {
          inlineData: {
            mimeType: part.mimeType,
            data: part.content.split(',')[1], // remove data:image/...;base64,
          },
        }
      }
      return { text: part.content }
    })

    // Ensure there's at least one text part, even if empty, for the API
    if (!geminiParts.some((p) => 'text' in p)) {
      geminiParts.push({ text: 'Analiza el siguiente material.' })
    }

    return geminiParts
  }

  async generateSynthesis(
    apiKey: string,
    source: SourceMaterialPart[]
  ): Promise<string> {
    const ai = this.getAi(apiKey)
    const model = 'gemini-2.5-flash-preview-04-17'

    const parts = this.convertSourceToParts(source)

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    })

    return response.text || ''
  }

  async generateTitle(
    apiKey: string,
    source: SourceMaterialPart[]
  ): Promise<string> {
    const ai = this.getAi(apiKey)
    const model = 'gemini-2.5-flash-preview-04-17'

    const parts = this.convertSourceToParts(source)

    const titlePrompt = `Based on the provided content, generate a concise, descriptive title (3-6 words) that captures the main topic or subject. Return only the title, nothing else. Make it specific and informative.`

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        systemInstruction: titlePrompt,
      },
    })

    return response.text?.trim() || 'Untitled Study'
  }

  async streamChat(apiKey: string, synthesis: string, history: ChatMessage[]) {
    const ai = this.getAi(apiKey)

    const formattedHistory = history.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash-preview-04-17',
      config: {
        systemInstruction: `${CHAT_SYSTEM_INSTRUCTION}\n\n## SYNTHESIS CONTEXT\n${synthesis}`,
      },
      history: formattedHistory,
    })

    const lastMessage = history[history.length - 1]
    const stream = await chat.sendMessageStream({
      message: lastMessage.content,
    })
    return stream
  }
}

export const geminiService = new GeminiService()
