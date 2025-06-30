import React, { useContext, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppContext } from '../App'
import { QuizRenderer } from './QuizRenderer'
import {
  Download,
  FileText,
  Brain,
  Sparkles,
  MessageSquare,
  BookOpen,
} from 'lucide-react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'

// Using jsPDF and html2canvas from global scope (CDN)
declare const jspdf: any
declare const html2canvas: any

export const OutputPanel: React.FC = () => {
  const context = useContext(AppContext)
  const outputRef = useRef<HTMLDivElement>(null)

  if (!context) return null
  const { activeStudy, showChat, setShowChat } = context

  if (
    !activeStudy ||
    (!activeStudy.synthesis && activeStudy.chatHistory.length === 0)
  ) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-8 text-center relative'>
        {/* Animated background */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-20 right-20 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-float'></div>
          <div
            className='absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float'
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <div className='max-w-md relative z-10 animate-fade-in-scale'>
          <div className='card-modern p-8'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <Brain className='w-8 h-8 text-gradient animate-pulse-glow' />
              <Sparkles className='w-6 h-6 text-orange-400 animate-bounce' />
              <h2 className='text-2xl font-bold text-gradient mb-3'>
                Results Panel
              </h2>
            </div>
            <p className='text-white/80 text-lg leading-relaxed'>
              The cognitive synthesis and interactive chat will appear here once
              you process your study material.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleExportTxt = () => {
    if (!activeStudy) return
    const chatTranscript = activeStudy.chatHistory
      .map(
        (msg) => `${msg.role === 'user' ? 'Usuario' : 'Simply'}: ${msg.content}`
      )
      .join('\n\n')
    const content = `Estudio: ${activeStudy.name}\n\n--- SÍNTESIS ---\n\n${activeStudy.synthesis}\n\n--- CHAT ---\n\n${chatTranscript}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeStudy.name.replace(/\s/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    if (!outputRef.current) return
    const { jsPDF } = jspdf
    const doc = new jsPDF('p', 'mm', 'a4')
    html2canvas(outputRef.current, {
      backgroundColor: '#0f172a',
      scale: 2,
    }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png')
      const imgProps = doc.getImageProperties(imgData)
      const pdfWidth = doc.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      doc.save(`${activeStudy.name.replace(/\s/g, '_')}.pdf`)
    })
  }

  // Custom renderer for markdown to detect and render quiz
  const renderers = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match ? match[1] : null

      if (lang === 'html-quiz') {
        const htmlContent = String(children).replace(/\n$/, '')
        return <QuizRenderer htmlContent={htmlContent} />
      }

      return !inline && match ? (
        <code
          className={`bg-white/10 px-2 py-1 rounded-lg text-orange-400 font-mono text-sm ${className}`}
          {...props}
        >
          {children}
        </code>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
  }

  return (
    <div className='flex flex-col h-full relative'>
      {/* Animated background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-3xl animate-float'></div>
        <div
          className='absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-tl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-float'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className='flex-shrink-0 p-6 border-b border-white/10 relative z-10'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <BookOpen className='w-6 h-6 text-orange-400' />
            <h2 className='text-xl font-bold text-white'>
              Cognitive Synthesis
            </h2>
          </div>
          <Button
            onClick={() => setShowChat(!showChat)}
            variant='outline'
            size='sm'
            className={cn(
              'glass-card border-white/20 text-white/80 hover:text-white hover:border-orange-500/50 transition-all duration-300',
              showChat && 'bg-orange-500/20 border-orange-500/50 text-white'
            )}
          >
            <MessageSquare className='w-4 h-4 mr-2' />
            {showChat ? 'Hide Chat' : 'Interactive Chat'}
          </Button>
        </div>

        <div className='flex gap-3'>
          <Button
            onClick={handleExportTxt}
            variant='outline'
            size='sm'
            className='glass-card border-white/20 text-white/80 hover:text-white hover:border-orange-500/50 transition-all duration-300'
          >
            <Download className='w-4 h-4 mr-2' />
            Export TXT
          </Button>
          <Button
            onClick={handleExportPdf}
            variant='outline'
            size='sm'
            className='glass-card border-white/20 text-white/80 hover:text-white hover:border-orange-500/50 transition-all duration-300'
          >
            <FileText className='w-4 h-4 mr-2' />
            Export PDF
          </Button>
        </div>
      </div>

      <div className='flex-grow overflow-hidden relative z-10'>
        <div
          className='h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar output-container'
          style={{ maxHeight: 'calc(100vh - 170px)' }}
        >
          <div ref={outputRef} className='p-6 prose-modern w-full max-w-full'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeStudy.synthesis}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
