export interface SaveToDownloadsOptions {
  fileName: string;
  data: string; // base64 string
  mimeType?: string;
}

export interface SaveToDownloadsResult {
  uri: string;
  path: string;
  success: boolean;
}

export interface DownloadsPlugin {
  saveToDownloads(options: SaveToDownloadsOptions): Promise<SaveToDownloadsResult>;
}
