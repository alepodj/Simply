import React, { useState, useContext, useEffect } from 'react'
import { AppContext } from '../App'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ExternalLink, Brain, Sparkles, Key, Shield } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const context = useContext(AppContext)
  const [localApiKey, setLocalApiKey] = useState('')
  const [error, setError] = useState('')

  if (!context) return null

  const { setApiKey, apiKey } = context

  // Load existing API key when modal opens
  useEffect(() => {
    if (isOpen && apiKey) {
      setLocalApiKey(apiKey)
    } else if (isOpen) {
      setLocalApiKey('')
    }
  }, [isOpen, apiKey])

  const handleSubmit = () => {
    if (localApiKey.trim() === '') {
      setError('API Key cannot be empty.')
      return
    }
    setApiKey(localApiKey.trim())
    onClose()
  }

  const handleClose = () => {
    // Allow closing if there's an existing API key (for configuration),
    // or if there's a new key entered (for initial setup)
    if (apiKey || localApiKey.trim() !== '') {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='dialog-modern border-white/20 text-white max-w-lg'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-4'>
            <div className='relative'>
              <Brain className='w-8 h-8 text-gradient animate-pulse-glow' />
              <Sparkles className='w-4 h-4 text-orange-400 absolute -top-1 -right-1 animate-bounce' />
            </div>
            <DialogTitle className='text-2xl font-bold text-gradient'>
              Required Setup
            </DialogTitle>
          </div>
          <DialogDescription className='text-white/80 text-lg leading-relaxed'>
            To use Simply, you need a Google AI Studio API Key. The app works
            entirely in your browser - your data never leaves your device.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          <div className='space-y-3'>
            <Label
              htmlFor='apiKey'
              className='text-white font-medium flex items-center gap-2'
            >
              <Key className='w-4 h-4 text-orange-400' />
              Your Google AI API Key
            </Label>
            <Input
              id='apiKey'
              type='password'
              value={localApiKey}
              onChange={(e) => {
                setLocalApiKey(e.target.value)
                if (error) setError('')
              }}
              className='input-modern text-white placeholder:text-white/40 focus:ring-orange-500/50'
              placeholder='Paste your key here'
            />
            {error && (
              <div className='p-3 bg-red-500/10 border border-red-500/20 rounded-xl'>
                <p className='text-red-400 text-sm'>{error}</p>
              </div>
            )}
          </div>

          <div className='p-4 glass-card rounded-xl'>
            <div className='flex items-start gap-3'>
              <Shield className='w-5 h-5 text-green-400 mt-0.5' />
              <div>
                <h4 className='font-semibold text-white mb-1'>
                  Privacy Guaranteed
                </h4>
                <p className='text-white/70 text-sm'>
                  Your API Key is stored locally in your browser and is only
                  used to communicate directly with Google AI Studio. It is
                  never sent to our servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex justify-between items-center'>
          <Button
            variant='link'
            asChild
            className='text-orange-400 hover:text-orange-300 p-0 h-auto group'
          >
            <a
              href='https://aistudio.google.com/app/apikey'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-2'
            >
              Get an API Key
              <ExternalLink className='w-4 h-4 group-hover:scale-110 transition-transform duration-300' />
            </a>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={localApiKey.trim() === ''}
            className='btn-modern text-white font-semibold group disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Sparkles className='w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500' />
            {apiKey ? 'Update Key' : 'Save and Start'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
