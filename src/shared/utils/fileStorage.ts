/**
 * Utility functions for storing and retrieving files using IndexedDB
 * This allows files to persist across page navigations during authentication flow
 */

const DB_NAME = 'suliko-file-storage';
const STORE_NAME = 'pending-files';
const FILE_KEY = 'pending-document-file';
const METADATA_KEY = 'pending-document-metadata';

export interface DocumentMetadata {
  realPageCount: number | null;
  selectedPageRange: { startPage: number; endPage: number } | null;
  currentSourceLanguageId: number;
  currentTargetLanguageId: number;
}

/**
 * Save a file to IndexedDB temporarily
 */
export async function saveFileToStorage(
  file: File,
  metadata?: DocumentMetadata
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Store file metadata and data
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        timestamp: Date.now(),
      };
      
      // Convert file to ArrayBuffer for storage
      file.arrayBuffer().then((buffer) => {
        const dataToStore = {
          ...fileData,
          data: buffer,
        };
        
        // Store both file and metadata
        const promises: Promise<void>[] = [
          new Promise((res, rej) => {
            const putRequest = store.put(dataToStore, FILE_KEY);
            putRequest.onsuccess = () => res();
            putRequest.onerror = () => rej(putRequest.error);
          }),
        ];

        if (metadata) {
          promises.push(
            new Promise((res, rej) => {
              const metadataRequest = store.put(metadata, METADATA_KEY);
              metadataRequest.onsuccess = () => res();
              metadataRequest.onerror = () => rej(metadataRequest.error);
            })
          );
        }
        
        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      }).catch(reject);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Retrieve a file from IndexedDB
 */
export async function getFileFromStorage(): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(FILE_KEY);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        // Reconstruct File object from stored data
        const { name, type, lastModified, data } = result;
        const file = new File([data], name, { type, lastModified });
        resolve(file);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Retrieve document metadata from IndexedDB
 */
export async function getMetadataFromStorage(): Promise<DocumentMetadata | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(METADATA_KEY);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result || null);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Clear the stored file and metadata from IndexedDB
 */
export async function clearFileFromStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Delete both file and metadata
      const deleteFileRequest = store.delete(FILE_KEY);
      const deleteMetadataRequest = store.delete(METADATA_KEY);
      
      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };
      
      deleteFileRequest.onsuccess = checkComplete;
      deleteFileRequest.onerror = () => reject(deleteFileRequest.error);
      deleteMetadataRequest.onsuccess = checkComplete;
      deleteMetadataRequest.onerror = () => reject(deleteMetadataRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}


export async function hasFileInStorage(): Promise<boolean> {
  const file = await getFileFromStorage();
  return file !== null;
}

