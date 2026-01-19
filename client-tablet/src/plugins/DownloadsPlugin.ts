import { registerPlugin } from '@capacitor/core';
import type { DownloadsPlugin as IDownloadsPlugin } from './definitions';

const DownloadsPlugin = registerPlugin<IDownloadsPlugin>('Downloads', {
  web: () => import('./DownloadsPluginWeb').then(m => new m.DownloadsPluginWeb()),
});

export * from './definitions';
export { DownloadsPlugin };
