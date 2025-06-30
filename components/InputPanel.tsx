import React, { useContext, useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { AppContext } from '../App'
import { fileProcessorService } from '../services/fileProcessorService'
import { geminiService } from '../services/geminiService'
import { SourceMaterialPart, Study } from '../types'
import {
  Brain,
  Upload,
  Loader2,
  Sparkles,
  Zap,
  FileText,
  Image,
  Type,
  FileUp,
} from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '@/lib/utils'

export const InputPanel: React.FC = () => {
  const context = useContext(AppContext)
  const [textInput, setTextInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTextMode, setIsTextMode] = useState(false)

  const { activeStudy, updateStudy, apiKey } = context || {}

  useEffect(() => {
    if (activeStudy) {
      const textPart = activeStudy.sourceMaterial.parts.find(
        (p) => p.type === 'text'
      )
      setTextInput(textPart?.content || '')
    } else {
      setTextInput('')
    }
  }, [activeStudy])

  const handleMaterialUpdate = useCallback(
    (parts: SourceMaterialPart[], fileName?: string) => {
      if (activeStudy && updateStudy) {
        const updatedStudy: Study = {
          ...activeStudy,
          sourceMaterial: {
            parts,
            fileName: fileName || activeStudy.sourceMaterial.fileName,
          },
        }
        updateStudy(updatedStudy)
      }
    },
    [activeStudy, updateStudy]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null)
      if (!acceptedFiles.length) return
      const file = acceptedFiles[0]
      try {
        const parts = await fileProcessorService.processFile(file)
        handleMaterialUpdate(parts, file.name)
      } catch (err) {
        setError('Error processing the file. Please try again.')
        console.error(err)
      }
    },
    [handleMaterialUpdate]
  )

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          event.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            try {
              const parts = await fileProcessorService.processFile(file)
              handleMaterialUpdate(parts, file.name)
            } catch (err) {
              setError('Error processing the pasted image.')
              console.error(err)
            }
          }
          return
        }
      }
    },
    [handleMaterialUpdate]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isTextMode,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
  })

  const handleSynthesize = async () => {
    if (!activeStudy || !apiKey || !updateStudy) return

    // Combine text area content with file content
    const currentParts = activeStudy.sourceMaterial.parts
    const textPartIndex = currentParts.findIndex((p) => p.type === 'text')
    let finalParts: SourceMaterialPart[]

    if (textPartIndex > -1) {
      currentParts[textPartIndex].content = textInput
      finalParts =
        textInput.trim() === ''
          ? currentParts.filter((p) => p.type !== 'text')
          : currentParts
    } else if (textInput.trim() !== '') {
      finalParts = [
        ...currentParts,
        { type: 'text', content: textInput, mimeType: 'text/plain' },
      ]
    } else {
      finalParts = currentParts
    }

    if (finalParts.length === 0) {
      setError('Please provide study material (text or file).')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Generate both synthesis and title in parallel
      const [synthesis, autoTitle] = await Promise.all([
        geminiService.generateSynthesis(apiKey, finalParts),
        geminiService.generateTitle(apiKey, finalParts),
      ])

      // Only update the title if it's still the default "New Study X" name
      const shouldUpdateTitle = activeStudy.name.startsWith('New Study')

      updateStudy({
        ...activeStudy,
        sourceMaterial: { ...activeStudy.sourceMaterial, parts: finalParts },
        synthesis,
        name: shouldUpdateTitle ? autoTitle : activeStudy.name,
        chatHistory: [],
      })
    } catch (e) {
      console.error(e)
      setError(
        'An error occurred while communicating with the AI. Please check your API Key and connection.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Save text input when switching modes
  const handleModeSwitch = (newMode: boolean) => {
    if (textInput.trim() !== '' && activeStudy) {
      handleMaterialUpdate(activeStudy.sourceMaterial.parts)
    }
    setIsTextMode(newMode)
  }

  if (!context || !activeStudy) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-8 text-center relative'>
        {/* Animated background */}
        <div className='absolute inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl animate-float'></div>
          <div
            className='absolute bottom-20 right-20 w-64 h-64 bg-gradient-to-tl from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float'
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        <Card className='card-modern max-w-md relative z-10 animate-fade-in-scale'>
          <CardHeader>
            <CardTitle className='text-3xl font-bold text-gradient flex items-center justify-center gap-3'>
              <Brain className='w-8 h-8 animate-pulse-glow' />
              <Sparkles className='w-6 h-6 text-orange-400 animate-bounce' />
              <h2 className='text-2xl font-bold text-gradient mb-2'>
                Welcome to Simply
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-white/80 text-lg leading-relaxed'>
              Create or select a "Study" in the sidebar to start your AI-powered
              learning journey.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const imagePart = activeStudy.sourceMaterial.parts.find(
    (p) => p.type === 'image'
  )

  return (
    <div className='flex flex-col h-full p-6 relative'>
      {/* Animated background */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-10 right-10 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-3xl animate-float'></div>
        <div
          className='absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-tl from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-float'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <Card className='card-modern flex-1 relative z-10 animate-fade-in-scale'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-gradient flex items-center gap-3'>
            <Brain className='w-6 h-6' />
            Input Area
            <Sparkles className='w-5 h-5 text-orange-400 animate-pulse' />
          </CardTitle>
        </CardHeader>
        <CardContent className='flex-1 flex flex-col'>
          {isTextMode ? (
            // Text Input Mode
            <div className='flex-1 flex flex-col'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-white flex items-center gap-2'>
                  <Type className='w-5 h-5 text-orange-400' />
                  Text Input Mode
                </h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleModeSwitch(false)}
                  className='text-white/70 hover:text-white hover:bg-white/10'
                >
                  <FileUp className='w-4 h-4 mr-2' />
                  Switch to File Mode
                </Button>
              </div>

              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onBlur={() =>
                  handleMaterialUpdate(activeStudy.sourceMaterial.parts)
                }
                onPaste={handlePaste}
                placeholder='Type or paste your study material here...&#10;&#10;You can use advanced formatting:&#10;• Bullet points&#10;• **Bold text**&#10;• *Italic text*&#10;• # Headers&#10;• > Blockquotes&#10;• `Code snippets`'
                className='flex-1 input-modern resize-none text-lg placeholder:text-white/40 leading-relaxed overflow-y-auto'
                style={{
                  minHeight: '300px',
                  maxHeight: '400px',
                  height: 'auto',
                }}
              />

              <div className='mt-4 p-3 glass-card'>
                <p className='text-sm text-white/70'>
                  <strong>Advanced Formatting Tips:</strong>
                </p>
                <ul className='text-xs text-white/60 mt-2 space-y-1'>
                  <li>
                    • Use{' '}
                    <code className='bg-white/10 px-1 rounded'>**text**</code>{' '}
                    for <strong>bold</strong>
                  </li>
                  <li>
                    • Use{' '}
                    <code className='bg-white/10 px-1 rounded'>*text*</code> for{' '}
                    <em>italic</em>
                  </li>
                  <li>
                    • Use <code className='bg-white/10 px-1 rounded'>#</code>{' '}
                    for headers
                  </li>
                  <li>
                    • Use <code className='bg-white/10 px-1 rounded'>-</code> or{' '}
                    <code className='bg-white/10 px-1 rounded'>•</code> for
                    bullet points
                  </li>
                  <li>
                    • Use{' '}
                    <code className='bg-white/10 px-1 rounded'>`code`</code> for
                    inline code
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // File Upload Mode
            <div
              {...getRootProps()}
              className={cn(
                'flex-1 flex flex-col border-2 border-dashed rounded-2xl p-8 transition-all duration-300 relative overflow-hidden min-h-[400px]',
                isDragActive
                  ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-red-500/10'
                  : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'
              )}
            >
              {/* Drag overlay */}
              {isDragActive && (
                <div className='absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm flex items-center justify-center'>
                  <div className='text-center'>
                    <Upload className='w-16 h-16 text-orange-400 mx-auto mb-4 animate-bounce' />
                    <p className='text-xl font-semibold text-white'>
                      Drop the file here
                    </p>
                  </div>
                </div>
              )}

              <input {...getInputProps()} />

              {/* Background content - hidden when dragging but maintains space */}
              <div
                className={cn(
                  'flex-1 flex flex-col items-center justify-center text-center transition-opacity duration-300',
                  isDragActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
              >
                <Upload className='w-16 h-16 text-orange-400 mb-6 animate-pulse' />
                <h3 className='text-xl font-semibold text-white mb-2'>
                  Upload Study Material
                </h3>
                <p className='text-white/70 mb-6 max-w-md'>
                  Drag and drop your files here, or click to browse. Supported
                  formats: PDF, DOCX, TXT, PNG, JPG
                </p>

                <Button
                  variant='outline'
                  className='border-white/20 text-white hover:bg-white/10'
                >
                  Choose File
                </Button>
              </div>

              {/* Bottom text - hidden when dragging */}
              {!isDragActive && (
                <div className='self-center text-sm text-white/50 mt-auto flex items-center gap-2'>
                  <Upload className='w-4 h-4' />
                  Drag a file (.txt, .pdf, .docx, .png, .jpg) or use the
                  selector
                </div>
              )}
            </div>
          )}

          {/* Mode Toggle Button */}
          {!isTextMode && (
            <div className='mt-4 flex justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => handleModeSwitch(true)}
                className='text-white/70 hover:text-white hover:bg-white/10'
              >
                <Type className='w-4 h-4 mr-2' />
                Switch to Text Mode
              </Button>
            </div>
          )}

          {imagePart && (
            <div className='mt-6 p-4 glass-card'>
              <div className='flex items-center gap-2 mb-3'>
                <Image className='w-5 h-5 text-orange-400' />
                <p className='text-sm text-white/80 font-medium'>
                  Image uploaded:
                </p>
              </div>
              <img
                src={imagePart.content}
                alt='Study material'
                className='max-h-48 rounded-xl object-contain mx-auto'
              />
            </div>
          )}

          {activeStudy.sourceMaterial.fileName && !imagePart && (
            <div className='mt-6 p-4 glass-card'>
              <div className='flex items-center gap-2'>
                <FileText className='w-5 h-5 text-orange-400' />
                <p className='text-sm text-white/80 font-medium'>
                  File uploaded: {activeStudy.sourceMaterial.fileName}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className='mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl'>
              <p className='text-red-400 text-sm'>{error}</p>
            </div>
          )}

          <Button
            onClick={handleSynthesize}
            disabled={isLoading || !apiKey}
            className='w-full mt-6 btn-modern text-white font-semibold group relative overflow-hidden'
          >
            {isLoading ? (
              <>
                <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                Processing...
              </>
            ) : (
              <>
                <Brain className='w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300' />
                Synthesize Learning
                <Zap className='w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
