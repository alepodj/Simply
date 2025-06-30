
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface SourceMaterialPart {
  type: 'text' | 'image';
  content: string; // text content or base64 data URL for image
  mimeType?: string; // e.g., 'image/png'
}

export interface Study {
  id: string;
  name: string;
  sourceMaterial: {
    parts: SourceMaterialPart[];
    fileName?: string;
  };
  synthesis: string;
  chatHistory: ChatMessage[];
  createdAt: string;
}
