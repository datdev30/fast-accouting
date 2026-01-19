import { SaveToDownloadsOptions, SaveToDownloadsResult } from './definitions';

export class DownloadsPluginWeb {
  async saveToDownloads(options: SaveToDownloadsOptions): Promise<SaveToDownloadsResult> {
    // Web implementation: Use browser download
    const blob = this.base64ToBlob(options.data, options.mimeType || 'application/octet-stream');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return {
      uri: url,
      path: options.fileName,
      success: true
    };
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
