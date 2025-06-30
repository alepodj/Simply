
import { SourceMaterialPart } from '../types';

// Using pdfjs and mammoth from global scope (CDN)
declare const pdfjsLib: any;
declare const mammoth: any;

class FileProcessorService {

    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    private readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    private async processPdf(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        return fullText;
    }

    private async processDocx(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

    async processFile(file: File): Promise<SourceMaterialPart[]> {
        const mimeType = file.type;

        if (mimeType.startsWith('image/')) {
            const base64 = await this.readFileAsDataURL(file);
            return [{ type: 'image', content: base64, mimeType }];
        }

        let textContent = '';
        if (mimeType === 'application/pdf') {
            textContent = await this.processPdf(file);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            textContent = await this.processDocx(file);
        } else { // Default to text
            textContent = await this.readFileAsText(file);
        }

        return [{ type: 'text', content: textContent, mimeType: 'text/plain' }];
    }
}

export const fileProcessorService = new FileProcessorService();
