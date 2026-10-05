import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageAdapter {
  upload(file: File | Blob | Buffer, filename: string, contentType?: string): Promise<string>;
  delete(url: string): Promise<void>;
  getBuffer(url: string): Promise<Buffer>;
}

class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  async upload(file: File | Blob | Buffer, filename: string, contentType?: string): Promise<string> {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(filename);
    const uniqueName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return relative URL for serving
    return `/api/uploads/${uniqueName}`;
  }

  async delete(url: string): Promise<void> {
    const filename = url.replace('/api/uploads/', '');
    const filePath = path.join(this.uploadDir, filename);
    
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, ignore
    }
  }

  async getBuffer(url: string): Promise<Buffer> {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch file from remote URL (${response.status}): ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
    const filename = url.replace('/api/uploads/', '');
    const filePath = path.join(process.cwd(), this.uploadDir, filename);
    return fs.readFile(filePath);
  }
}

import { createClient } from '@supabase/supabase-js';

class SupabaseStorageAdapter implements StorageAdapter {
  private supabase;
  private bucket: string;

  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are missing');
    }
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.bucket = 'uploads';
  }

  async upload(file: File | Blob | Buffer, filename: string, contentType?: string): Promise<string> {
    const ext = path.extname(filename);
    const uniqueName = `${uuidv4()}${ext}`;
    
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(uniqueName, file, {
        upsert: false,
        contentType: contentType || 'application/octet-stream'
      });
      
    if (error) throw error;
    
    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(uniqueName);
      
    return publicUrlData.publicUrl;
  }

  async delete(url: string): Promise<void> {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    await this.supabase.storage.from(this.bucket).remove([filename]);
  }

  async getBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file from Supabase: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Singleton
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    if (process.env.STORAGE_PROVIDER === 'supabase') {
      storageInstance = new SupabaseStorageAdapter();
    } else {
      storageInstance = new LocalStorageAdapter();
    }
  }
  return storageInstance;
}
