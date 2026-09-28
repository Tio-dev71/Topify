export interface DownloadFileOptions {
  url: string;
  filename: string;
  title?: string;
}

export interface DownloadFileResult {
  success: boolean;
  canceled?: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

export interface DownloadProgressEvent {
  url: string;
  percent: number;
  receivedBytes: number;
  totalBytes: number;
}

declare global {
  interface Window {
    electron?: {
      isDesktopApp?: boolean;
      runFacebookLogin?: (accountData: any) => Promise<any>;
      startAutomationTask?: (taskData: any) => Promise<any>;
      stopAutomationTask?: (data: any) => Promise<any>;
      getActiveBrowsers?: () => Promise<Array<{ profileId: string; status: string; url?: string; title?: string; screenshot?: string; timestamp?: number }>>;
      closeActiveBrowser?: (profileId: string) => Promise<{ success: boolean; error?: string }>;
      downloadFile?: (options: DownloadFileOptions) => Promise<DownloadFileResult>;
      showItemInFolder?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      openExternal?: (url: string) => Promise<{ success: boolean; error?: string }>;
      onDownloadProgress?: (callback: (data: DownloadProgressEvent) => void) => () => void;
    };
  }
}
