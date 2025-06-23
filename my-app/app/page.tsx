"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, ImageIcon, Send, RefreshCw } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  type: "text" | "image"
  imageBase64?: string | null
  timestamp: Date
}

export default function MinimalistChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [microphonePermissionStatus, setMicrophonePermissionStatus] = useState(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const messagesEndRef = useRef(null)

  // Speech Recognition setup
  const SpeechRecognition =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null
  const recognition = useRef(null)

  // Initialize conversation on component mount
  useEffect(() => {
    initializeConversation()
  }, [])

  const initializeConversation = async () => {
    try {
      const response = await fetch("/api/conversation", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.conversationId)
        console.log("Conversation initialized:", data.conversationId)
      } else {
        console.error("Failed to initialize conversation")
      }
    } catch (error) {
      console.error("Error initializing conversation:", error)
    } finally {
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = "en-US"

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
        checkMicrophonePermission()
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }

    checkMicrophonePermission()
  }, [SpeechRecognition])

  const checkMicrophonePermission = async () => {
    if (typeof navigator !== "undefined" && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "microphone" })
        setMicrophonePermissionStatus(result.state)
        result.onchange = () => {
          setMicrophonePermissionStatus(result.state)
        }
      } catch (error) {
        console.error("Error querying microphone permission:", error)
        setMicrophonePermissionStatus("error")
      }
    } else {
      setMicrophonePermissionStatus("unsupported")
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading || !conversationId) {
      console.log("Cannot send message:", {
        inputMessage: inputMessage.trim(),
        selectedImage,
        isLoading,
        conversationId,
      })
      return
    }

    if (isListening && recognition.current) {
      recognition.current.stop()
      setIsListening(false)
    }

    const userMessage = inputMessage.trim()
    console.log("Sending message:", userMessage)

    setIsLoading(true)

    // Clear input immediately for better UX
    setInputMessage("")
    setSelectedImage(null)
    const fileInput = document.getElementById("image-upload-input")
    if (fileInput) fileInput.value = ""

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId,
        }),
      })

      const data = await response.json()
      console.log("API Response:", data)

      if (data.userMessage && data.botMessage) {
        // Update messages with the saved messages from database
        setMessages((prev) => [...prev, data.userMessage, data.botMessage])
      } else if (data.error) {
        console.error("API Error:", data.error)
        // Add error message to UI
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          type: "text",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: "Network error. Please check your connection and try again.",
        sender: "bot",
        type: "text",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedImage(null)
    }
  }

  const toggleListening = async () => {
    if (!recognition.current) {
      console.warn("Speech Recognition not supported.")
      return
    }

    if (isListening) {
      recognition.current.stop()
    } else {
      setInputMessage("")
      try {
        if (typeof navigator !== "undefined" && navigator.mediaDevices) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach((track) => track.stop())
          recognition.current.start()
        }
      } catch (error) {
        console.error("Microphone access denied or error:", error)
        setMicrophonePermissionStatus("denied")
        setIsListening(false)
        return
      }
    }
    setIsListening(!isListening)
  }

  const handleNewConversation = () => {
    setMessages([])
    setInputMessage("")
    setSelectedImage(null)
    initializeConversation()
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="minimal-spinner mb-4"></div>
          <p className="text-gray-500 font-light">Initializing My.AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 font-mono">
      {/* Floating 3D Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 bg-gray-200 rounded-lg transform rotate-12 animate-float-slow opacity-30"></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-gray-300 rounded-full animate-float-medium opacity-20"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-8 bg-gray-200 rounded-full transform -rotate-6 animate-float-fast opacity-25"></div>
        <div className="absolute top-1/3 right-20 w-8 h-20 bg-gray-300 rounded-lg transform rotate-45 animate-float-slow opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto h-screen flex flex-col">
        {/* Minimalist Logo Header */}
        <header className="text-center py-12 mb-8">
          <div className="relative inline-block">
            {/* 3D Logo Background */}
            <div className="absolute inset-0 bg-gray-900 rounded-2xl transform translate-x-1 translate-y-1 opacity-10"></div>
            <div className="relative bg-white border border-gray-200 rounded-2xl px-8 py-4 shadow-sm">
              <h1 className="text-4xl font-light text-gray-900 tracking-wider">My.AI</h1>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6 font-light tracking-wide">Powered by Gemini 1.5 Flash</p>
          {conversationId && (
            <p className="text-xs text-gray-400 mt-2 font-light">Session: {conversationId.slice(-8)}</p>
          )}
        </header>

        {/* Permission Warnings */}
        {microphonePermissionStatus === "denied" && (
          <div className="minimal-card bg-red-50 border-red-200 text-red-700 p-4 rounded-xl mb-6 animate-slide-in">
            <p className="text-center text-sm font-light">Microphone access required for voice input</p>
          </div>
        )}

        {/* Minimalist Chat Area */}
        <div className="flex-1 minimal-card-3d mb-8 overflow-hidden">
          <div className="h-full flex flex-col p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-light text-gray-700">Conversation</h2>
              <Button
                onClick={handleNewConversation}
                className="minimal-button"
                size="sm"
                title="Start new conversation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 minimal-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-sm font-light">
                    <p className="mb-2">Welcome to My.AI</p>
                    <p>Start a conversation by typing a message below</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-message-slide`}
                >
                  {msg.type === "text" ? (
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl transition-all duration-200 hover:shadow-md ${
                        msg.sender === "user"
                          ? "bg-gray-900 text-white minimal-shadow-dark"
                          : "bg-gray-100 text-gray-900 minimal-shadow-light"
                      }`}
                    >
                      <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <p className="text-xs opacity-60 mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <div className="max-w-[70%] p-4 rounded-2xl bg-gray-50 border border-gray-200 minimal-shadow-light">
                      {msg.imageBase64 && (
                        <img
                          src={msg.imageBase64 || "/placeholder.svg"}
                          alt="Shared image"
                          className="max-w-full h-auto rounded-xl border border-gray-200"
                        />
                      )}
                      {msg.text && <p className="mt-3 text-sm font-light text-gray-700">{msg.text}</p>}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-message-slide">
                  <div className="max-w-[70%] p-4 rounded-2xl bg-gray-100 minimal-shadow-light">
                    <div className="flex items-center space-x-3">
                      <div className="minimal-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="text-sm font-light text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Minimalist Input Area */}
        <div className="minimal-card-3d p-6">
          <div className="flex items-center space-x-4">
            {/* Voice Input */}
            <Button
              onClick={toggleListening}
              className={`minimal-button ${isListening ? "listening" : ""}`}
              disabled={isLoading || !conversationId}
              size="icon"
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            {/* Image Upload */}
            <label htmlFor="image-upload-input">
              <Button
                type="button"
                className="minimal-button"
                disabled={isLoading || isListening || !conversationId}
                size="icon"
                asChild
                title="Upload image"
              >
                <div>
                  <ImageIcon className="h-4 w-4" />
                </div>
              </Button>
            </label>
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={isLoading || isListening}
            />

            {/* Text Input */}
            <Input
              type="text"
              className="flex-1 minimal-input"
              placeholder={selectedImage ? "Add caption..." : conversationId ? "Ask me anything..." : "Initializing..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading || isListening || !conversationId}
            />

            {/* Minimalist Send Button */}
            <Button
              onClick={handleSendMessage}
              className="minimal-send-button"
              disabled={isLoading || (!inputMessage.trim() && !selectedImage) || !conversationId}
              size="icon"
              title="Send message"
            >
              {isLoading ? <div className="minimal-spinner"></div> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }

        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(90deg); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes message-slide {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes minimal-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-message-slide {
          animation: message-slide 0.4s ease-out;
        }

        .minimal-card {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .minimal-card-3d {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border-radius: 1rem;
          position: relative;
        }

        .minimal-card-3d::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
          border-radius: inherit;
          z-index: -1;
        }

        .minimal-shadow-light {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .minimal-shadow-dark {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .minimal-button {
          background: white;
          border: 1px solid #d1d5db;
          color: #6b7280;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .minimal-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          color: #374151;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .minimal-button.active {
          background: #111827;
          border-color: #111827;
          color: white;
        }

        .minimal-button.listening {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          animation: pulse 1s infinite;
        }

        .minimal-input {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #111827;
          font-weight: 300;
          transition: all 0.2s ease;
        }

        .minimal-input:focus {
          background: white;
          border-color: #6b7280;
          box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.1);
        }

        .minimal-input::placeholder {
          color: #9ca3af;
          font-weight: 300;
        }

        .minimal-send-button {
          background: #111827;
          border: 1px solid #111827;
          color: white;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .minimal-send-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .minimal-send-button:hover::before {
          transform: translateX(100%);
        }

        .minimal-send-button:hover {
          background: #000000;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .minimal-send-button:disabled {
          opacity: 0.5;
          transform: none;
        }

        .minimal-typing {
          display: flex;
          gap: 4px;
        }

        .minimal-typing span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #9ca3af;
          animation: minimal-typing 1.4s infinite;
        }

        .minimal-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .minimal-typing span:nth-child(3) {
          animation-delay: 0.4s;
        }

        .minimal-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-top: 2px solid #111827;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .minimal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .minimal-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
        }

        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .minimal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
