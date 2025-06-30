import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Sidebar } from './components/Sidebar'
import { InputPanel } from './components/InputPanel'
import { OutputPanel } from './components/OutputPanel'
import { SettingsModal } from './components/SettingsModal'
import { Study, ChatMessage, SourceMaterialPart } from './types'
import { storageService } from './services/storageService'
import { Button } from './components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { Chat } from './components/Chat'

export const AppContext = React.createContext<{
  apiKey: string | null
  setApiKey: (key: string | null) => void
  showSettingsModal: () => void
  studies: Study[]
  activeStudy: Study | null
  setActiveStudyId: (id: string | null) => void
  addStudy: (name: string) => void
  deleteStudy: (id: string) => void
  updateStudy: (study: Study) => void
  addMessageToChat: (studyId: string, message: ChatMessage) => void
  streamMessageToChat: (studyId: string, messagePart: string) => void
  clearLastBotMessage: (studyId: string) => void
  showDeleteConfirm: string | null
  setShowDeleteConfirm: (id: string | null) => void
  showChat: boolean
  setShowChat: (show: boolean) => void
} | null>(null)

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    storageService.getApiKey()
  )
  const [studies, setStudies] = useState<Study[]>([])
  const [activeStudyId, setActiveStudyId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  )
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const loadedStudies = storageService.getStudies()
    setStudies(loadedStudies)
    if (loadedStudies.length > 0) {
      setActiveStudyId(loadedStudies[0].id)
    }
    setIsInitialLoad(false)
    // Show settings modal if no API key is set
    if (!storageService.getApiKey()) {
      setShowSettingsModal(true)
    }
  }, [])

  const handleSetApiKey = useCallback((key: string | null) => {
    storageService.setApiKey(key)
    setApiKey(key)
    setShowSettingsModal(false)
  }, [])

  const handleCloseSettingsModal = useCallback(() => {
    setShowSettingsModal(false)
  }, [])

  const addStudy = useCallback(
    (name: string) => {
      const newStudy: Study = {
        id: `study_${Date.now()}`,
        name,
        sourceMaterial: { parts: [] },
        synthesis: '',
        chatHistory: [],
        createdAt: new Date().toISOString(),
      }
      const updatedStudies = [newStudy, ...studies]
      setStudies(updatedStudies)
      storageService.saveStudies(updatedStudies)
      setActiveStudyId(newStudy.id)
    },
    [studies]
  )

  const deleteStudy = useCallback(
    (id: string) => {
      const updatedStudies = studies.filter((s) => s.id !== id)
      setStudies(updatedStudies)
      storageService.saveStudies(updatedStudies)
      if (activeStudyId === id) {
        setActiveStudyId(
          updatedStudies.length > 0 ? updatedStudies[0].id : null
        )
      }
    },
    [studies, activeStudyId]
  )

  const updateStudy = useCallback(
    (updatedStudy: Study) => {
      const updatedStudies = studies.map((s) =>
        s.id === updatedStudy.id ? updatedStudy : s
      )
      setStudies(updatedStudies)
      storageService.saveStudies(updatedStudies)
    },
    [studies]
  )

  const addMessageToChat = useCallback(
    (studyId: string, message: ChatMessage) => {
      const studyToUpdate = studies.find((s) => s.id === studyId)
      if (studyToUpdate) {
        const updatedStudy = {
          ...studyToUpdate,
          chatHistory: [...studyToUpdate.chatHistory, message],
        }
        updateStudy(updatedStudy)
      }
    },
    [studies, updateStudy]
  )

  const streamMessageToChat = useCallback(
    (studyId: string, messagePart: string) => {
      setStudies((prevStudies) => {
        const newStudies = prevStudies.map((s) => {
          if (s.id === studyId) {
            const newHistory = [...s.chatHistory]
            if (
              newHistory.length > 0 &&
              newHistory[newHistory.length - 1].role === 'model'
            ) {
              newHistory[newHistory.length - 1].content += messagePart
            } else {
              newHistory.push({ role: 'model', content: messagePart })
            }
            return { ...s, chatHistory: newHistory }
          }
          return s
        })
        storageService.saveStudies(newStudies)
        return newStudies
      })
    },
    []
  )

  const clearLastBotMessage = useCallback(
    (studyId: string) => {
      const studyToUpdate = studies.find((s) => s.id === studyId)
      if (
        studyToUpdate &&
        studyToUpdate.chatHistory.length > 0 &&
        studyToUpdate.chatHistory[studyToUpdate.chatHistory.length - 1].role ===
          'model'
      ) {
        const lastMessage =
          studyToUpdate.chatHistory[studyToUpdate.chatHistory.length - 1]
        if (lastMessage.content === '') {
          const updatedStudy = {
            ...studyToUpdate,
            chatHistory: studyToUpdate.chatHistory.slice(0, -1),
          }
          updateStudy(updatedStudy)
        }
      }
    },
    [studies, updateStudy]
  )

  const activeStudy = useMemo(
    () => studies.find((s) => s.id === activeStudyId) || null,
    [studies, activeStudyId]
  )

  const contextValue = useMemo(
    () => ({
      apiKey,
      setApiKey: handleSetApiKey,
      showSettingsModal: () => setShowSettingsModal(true),
      studies,
      activeStudy,
      setActiveStudyId,
      addStudy,
      deleteStudy,
      updateStudy,
      addMessageToChat,
      streamMessageToChat,
      clearLastBotMessage,
      showDeleteConfirm,
      setShowDeleteConfirm,
      showChat,
      setShowChat,
    }),
    [
      apiKey,
      handleSetApiKey,
      showSettingsModal,
      studies,
      activeStudy,
      addStudy,
      deleteStudy,
      updateStudy,
      addMessageToChat,
      streamMessageToChat,
      clearLastBotMessage,
      showDeleteConfirm,
      setShowDeleteConfirm,
      showChat,
      setShowChat,
    ]
  )

  if (isInitialLoad) {
    return (
      <div className='flex items-center justify-center h-screen bg-brand-background'>
        <div className='text-xl text-brand-text-secondary'>
          Loading Simply...
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={contextValue}>
      {!apiKey && (
        <SettingsModal isOpen={true} onClose={handleCloseSettingsModal} />
      )}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={handleCloseSettingsModal}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4'>
          <div className='dialog-modern max-w-md w-full relative animate-fade-in-scale'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-5 h-5 text-red-400' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-white'>
                  Delete Study
                </h3>
                <p className='text-sm text-white/70'>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className='text-white/80 mb-6'>
              Are you sure you want to delete this study? All associated data
              will be permanently removed.
            </p>

            <div className='flex gap-3'>
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant='ghost'
                className='flex-1 text-white/70 hover:text-white hover:bg-white/10'
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showDeleteConfirm) {
                    deleteStudy(showDeleteConfirm)
                    setShowDeleteConfirm(null)
                  }
                }}
                className='flex-1 bg-red-500 hover:bg-red-600 text-white'
              >
                Delete Study
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='flex h-screen w-full font-sans overflow-hidden'>
        <Sidebar />
        <main className='flex-1 grid grid-cols-1 lg:grid-cols-2 h-screen overflow-hidden'>
          <div className='h-full overflow-hidden flex flex-col'>
            <div className={showChat ? 'h-1/2' : 'h-full'}>
              <InputPanel />
            </div>
            {showChat && (
              <div className='h-1/2 overflow-hidden'>
                <Chat />
              </div>
            )}
          </div>
          <div className='h-full overflow-hidden'>
            <OutputPanel />
          </div>
        </main>
      </div>
    </AppContext.Provider>
  )
}

export default App
