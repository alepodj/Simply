import { Study } from '../types'

const API_KEY_STORAGE_KEY = 'Simply_apiKey'
const STUDIES_STORAGE_KEY = 'Simply_studies'

class StorageService {
  // API Key Management
  setApiKey(key: string | null): void {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key)
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
  }

  getApiKey(): string | null {
    return localStorage.getItem(API_KEY_STORAGE_KEY)
  }

  // Studies Management
  saveStudies(studies: Study[]): void {
    try {
      const studiesJson = JSON.stringify(studies)
      localStorage.setItem(STUDIES_STORAGE_KEY, studiesJson)
    } catch (error) {
      console.error('Error saving studies to localStorage:', error)
      // Could implement a more user-facing error message here
    }
  }

  getStudies(): Study[] {
    try {
      const studiesJson = localStorage.getItem(STUDIES_STORAGE_KEY)
      return studiesJson ? JSON.parse(studiesJson) : []
    } catch (error) {
      console.error('Error retrieving studies from localStorage:', error)
      return []
    }
  }
}

export const storageService = new StorageService()
