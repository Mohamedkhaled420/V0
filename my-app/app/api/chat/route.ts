import { type NextRequest, NextResponse } from "next/server"
import { addMessage, getMessages } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return NextResponse.json({ error: "API configuration error" }, { status: 500 })
    }

    // Save user message to database
    const userMessage = addMessage(conversationId, {
      text: message,
      sender: "user",
      type: "text",
    })

    // Get conversation history for context
    const history = getMessages(conversationId)

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    // Format conversation history for Gemini (last 10 messages for context)
    const contents = []
    const recentHistory = history.slice(-10)

    recentHistory.forEach((msg) => {
      if (msg.text && msg.text.trim()) {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })
      }
    })

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API Error:", errorData)

      // Save error message to database
      const errorMessage = addMessage(conversationId, {
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        sender: "bot",
        type: "text",
      })

      return NextResponse.json(
        {
          error: "Failed to generate response",
          userMessage,
          botMessage: errorMessage,
        },
        { status: response.status },
      )
    }

    const result = await response.json()

    let botResponseText = "I'm sorry, I couldn't generate a proper response. Please try again."

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      botResponseText = result.candidates[0].content.parts[0].text
    }

    // Save bot response to database
    const botMessage = addMessage(conversationId, {
      text: botResponseText,
      sender: "bot",
      type: "text",
    })

    return NextResponse.json({
      success: true,
      userMessage,
      botMessage,
      response: botResponseText,
    })
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
