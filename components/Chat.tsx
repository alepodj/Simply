import React, { useContext, useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppContext } from '../App'
import { geminiService } from '../services/geminiService'
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

interface ChatProps {
  components?: any
}

export const Chat: React.FC<ChatProps> = ({ components = {} }) => {
  const context = useContext(AppContext)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    activeStudy,
    addMessageToChat,
    streamMessageToChat,
    clearLastBotMessage,
    apiKey,
  } = context || {}

  // Smooth scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      const scrollOptions: ScrollToOptions = {
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      }
      chatContainerRef.current.scrollTo(scrollOptions)
    }
  }

  // Handle scroll events to show/hide scroll button
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50
      const hasScrollableContent = scrollHeight > clientHeight
      setShowScrollButton(hasScrollableContent && !isNearBottom)
    }
  }

  // Enhanced scroll effect that works during streaming
  useEffect(() => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Scroll immediately for new messages
    scrollToBottom(false)

    // Then scroll smoothly after a short delay to ensure content is rendered
    scrollTimeoutRef.current = setTimeout(() => {
      scrollToBottom(true)
    }, 100)

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [activeStudy?.chatHistory])

  // Additional scroll effect during streaming
  useEffect(() => {
    if (isStreaming) {
      // Scroll immediately when streaming starts
      scrollToBottom(true)

      // Then scroll more frequently during streaming
      const interval = setInterval(() => {
        scrollToBottom(true)
      }, 200) // Scroll every 200ms during streaming for smoother experience

      return () => clearInterval(interval)
    }
  }, [isStreaming])

  // Also scroll when the last message content changes (for streaming updates)
  useEffect(() => {
    if (activeStudy?.chatHistory.length > 0) {
      const lastMessage =
        activeStudy.chatHistory[activeStudy.chatHistory.length - 1]
      if (lastMessage.role === 'model' && isStreaming) {
        // Scroll immediately when the model message content changes
        scrollToBottom(true)
      }
    }
  }, [activeStudy?.chatHistory, isStreaming])

  // More aggressive scroll during streaming - scroll on every render when streaming
  useEffect(() => {
    if (isStreaming) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }
  })

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !input.trim() ||
      !activeStudy ||
      !apiKey ||
      !addMessageToChat ||
      !streamMessageToChat ||
      !clearLastBotMessage
    )
      return

    const userMessage = { role: 'user' as const, content: input }
    addMessageToChat(activeStudy.id, userMessage)
    setInput('')
    setIsStreaming(true)

    try {
      const stream = await geminiService.streamChat(
        apiKey,
        activeStudy.synthesis,
        [...activeStudy.chatHistory, userMessage]
      )

      // Add an empty model message to start appending to
      streamMessageToChat(activeStudy.id, '')

      for await (const chunk of stream) {
        streamMessageToChat(activeStudy.id, chunk.text)
      }
    } catch (error) {
      console.error('Error streaming chat:', error)
      streamMessageToChat(
        activeStudy.id,
        '\n\n> *An error occurred while contacting the AI model.*'
      )
    } finally {
      setIsStreaming(false)
      // Clean up if the bot message is empty
      clearLastBotMessage(activeStudy.id)
    }
  }

  if (!activeStudy) return null

  return (
    <div className='flex flex-col h-full relative'>
      {/* Animated background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-2xl animate-float'></div>
        <div
          className='absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-tl from-blue-500/5 to-purple-500/5 rounded-full blur-2xl animate-float'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Header */}
      <div className='flex-shrink-0 p-4 border-b border-white/10 relative z-10'>
        <div className='flex items-center gap-3'>
          <MessageSquare className='w-5 h-5 text-orange-400' />
          <h3 className='text-lg font-semibold text-white'>Interactive Chat</h3>
        </div>
      </div>

      {/* Chat messages container - this needs a specific height */}
      <div
        ref={chatContainerRef}
        className='flex-1 min-h-0 p-6 relative z-10 custom-scrollbar overflow-y-auto'
        onScroll={handleScroll}
      >
        <div className='space-y-6'>
          {activeStudy.chatHistory.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex animate-slide-up',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={cn(
                  'max-w-xl lg:max-w-2xl px-6 py-4 rounded-2xl relative group',
                  msg.role === 'user'
                    ? 'chat-bubble-user text-white'
                    : 'chat-bubble-ai text-white'
                )}
              >
                {/* Message header */}
                <div className='flex items-center gap-2 mb-2'>
                  {msg.role === 'user' ? (
                    <User className='w-4 h-4 text-white/80' />
                  ) : (
                    <Bot className='w-4 h-4 text-orange-400' />
                  )}
                  <span className='text-xs font-medium opacity-70'>
                    {msg.role === 'user' ? 'You' : 'Simply'}
                  </span>
                </div>

                {/* Message content */}
                <div className='prose-modern text-sm max-w-none'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className='flex justify-start animate-slide-up'>
              <div className='max-w-xl lg:max-w-2xl px-6 py-4 rounded-2xl chat-bubble-ai'>
                <div className='flex items-center gap-2 mb-2'>
                  <Bot className='w-4 h-4 text-orange-400' />
                  <span className='text-xs font-medium opacity-70'>Simply</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='loading-dots'>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span className='text-white/70 text-sm'>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button - positioned at bottom of chat area */}
      {showScrollButton && (
        <div className='absolute bottom-22 right-6 z-20'>
          <Button
            onClick={() => scrollToBottom(true)}
            size='sm'
            className='btn-modern text-white rounded-full w-10 h-10 p-0 shadow-lg hover:scale-110 transition-transform duration-200'
          >
            <ChevronDown className='w-5 h-5' />
          </Button>
        </div>
      )}

      <div className='flex-shrink-0 p-6 border-t border-white/10 relative z-10'>
        <form
          onSubmit={handleSendMessage}
          className='flex items-center space-x-3'
        >
          <Input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : 'Ask a question about your study material...'
            }
            disabled={isStreaming}
            className='flex-grow input-modern text-white placeholder:text-white/40 focus:ring-orange-500/50'
          />
          <Button
            type='submit'
            disabled={!input.trim() || isStreaming}
            className='btn-modern text-white font-semibold group relative overflow-hidden'
            size='icon'
          >
            {isStreaming ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <>
                <Send className='w-5 h-5 group-hover:scale-110 transition-transform duration-300' />
                <Sparkles className='w-4 h-4 absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
