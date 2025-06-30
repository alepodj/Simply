import React, { useState, useContext, useRef, useEffect } from 'react'
import { AppContext } from '../App'
import { Study } from '../types'
import {
  Plus,
  Trash2,
  Edit,
  Settings,
  Brain,
  Sparkles,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'

export const Sidebar: React.FC = () => {
  const context = useContext(AppContext)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  if (!context) return null

  const {
    studies,
    activeStudy,
    setActiveStudyId,
    addStudy,
    deleteStudy,
    updateStudy,
    showSettingsModal,
    setShowDeleteConfirm,
  } = context

  const handleNewStudy = () => {
    const studyName = `New Study ${studies.length + 1}`
    addStudy(studyName)
  }

  const handleRename = (study: Study) => {
    setEditingId(study.id)
    setEditingName(study.name)
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId && editingName.trim()) {
      const studyToUpdate = studies.find((s) => s.id === editingId)
      if (studyToUpdate) {
        updateStudy({ ...studyToUpdate, name: editingName.trim() })
      }
    }
    setEditingId(null)
    setEditingName('')
  }

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id)
  }

  return (
    <aside className='w-80 sidebar-modern flex flex-col relative'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-float'></div>
        <div
          className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float'
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      {/* Header */}
      <div className='relative z-10 p-4 border-b border-white/10'>
        <div className='flex items-center gap-2 mb-2'>
          <div className='relative'>
            <Brain className='w-6 h-6 text-gradient animate-pulse-glow' />
            <Sparkles className='w-3 h-3 text-orange-400 absolute -top-1 -right-1 animate-bounce' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-gradient'>Simply</h1>
            <p className='text-xs text-white/60 font-medium'>
              Your cognitive companion
            </p>
          </div>
        </div>
      </div>

      {/* New Study Button */}
      <div className='relative z-10 p-4'>
        <Button
          onClick={handleNewStudy}
          className='w-full btn-modern text-white font-semibold group text-sm'
        >
          <Plus className='w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300' />
          New Study
          <Zap className='w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
        </Button>
      </div>

      {/* Studies List */}
      <ScrollArea className='flex-1 px-4 relative z-10'>
        <div className='space-y-1'>
          {studies.map((study, index) => (
            <div
              key={study.id}
              className={cn(
                'group sidebar-study-item cursor-pointer transition-all duration-300 animate-slide-up p-3 min-h-[3rem] flex items-center',
                activeStudy?.id === study.id ? 'ring-2 ring-orange-500/50' : ''
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setActiveStudyId(study.id)}
            >
              {editingId === study.id ? (
                <form onSubmit={handleRenameSubmit} className='flex-1 min-w-0'>
                  <Input
                    ref={inputRef}
                    type='text'
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    className='input-modern text-white focus:ring-orange-500/50 h-8 text-sm'
                  />
                </form>
              ) : (
                <div className='flex items-center justify-between min-w-0 w-full'>
                  <span className='flex-1 text-sm text-white font-medium leading-tight break-words pr-2 text-center'>
                    {study.name}
                  </span>
                  <div className='flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1 flex-shrink-0'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(study)
                      }}
                      className='h-5 w-5 p-0 hover:bg-white/10 text-white/70 hover:text-white'
                    >
                      <Edit className='w-2.5 h-2.5' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(study.id)
                      }}
                      className='h-5 w-5 p-0 hover:bg-red-500/20 text-white/70 hover:text-red-400'
                    >
                      <Trash2 className='w-2.5 h-2.5' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className='relative z-10 p-4 border-t border-white/10'>
        <Button
          variant='ghost'
          onClick={showSettingsModal}
          className='w-full justify-start text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group text-sm'
        >
          <Settings className='w-3 h-3 mr-2 group-hover:rotate-180 transition-transform duration-500' />
          Configure API Key
        </Button>
      </div>
    </aside>
  )
}
