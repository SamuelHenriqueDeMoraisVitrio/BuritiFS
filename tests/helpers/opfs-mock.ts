// In-memory mock for the OPFS (Origin Private File System) browser API.
// Implements navigator.storage.getDirectory() and the handles it returns.

class MockWritable {
  private chunks: (string | ArrayBuffer)[] = [];

  constructor(private onClose: (data: string | ArrayBuffer) => void) {}

  async write(data: string | ArrayBuffer): Promise<void> {
    this.chunks.push(data);
  }

  async close(): Promise<void> {
    if (this.chunks.length === 1) {
      this.onClose(this.chunks[0]);
    } else {
      // Merge all chunks into a single string
      const merged = this.chunks
        .map((c) => (c instanceof ArrayBuffer ? new TextDecoder().decode(c) : c))
        .join('');
      this.onClose(merged);
    }
  }
}

class MockFileHandle {
  constructor(private storage: Map<string, ArrayBuffer>, private id: string) {}

  async createWritable(): Promise<MockWritable> {
    return new MockWritable((data) => {
      const buffer =
        data instanceof ArrayBuffer
          ? data
          : new TextEncoder().encode(data).buffer as ArrayBuffer;
      this.storage.set(this.id, buffer);
    });
  }

  async getFile(): Promise<{ arrayBuffer: () => Promise<ArrayBuffer>; text: () => Promise<string> }> {
    const buf = this.storage.get(this.id) ?? new ArrayBuffer(0);
    return {
      arrayBuffer: async () => buf,
      text: async () => new TextDecoder().decode(buf),
    };
  }
}

class MockDirectoryHandle {
  private files = new Map<string, ArrayBuffer>();

  async getFileHandle(
    id: string,
    options?: { create?: boolean }
  ): Promise<MockFileHandle> {
    if (!this.files.has(id)) {
      if (!options?.create) {
        throw new DOMException(`File "${id}" not found`, 'NotFoundError');
      }
      this.files.set(id, new ArrayBuffer(0));
    }
    return new MockFileHandle(this.files, id);
  }

  async removeEntry(id: string): Promise<void> {
    if (!this.files.has(id)) {
      throw new DOMException(`File "${id}" not found`, 'NotFoundError');
    }
    this.files.delete(id);
  }
}

export function setupOPFSMock(): void {
  const root = new MockDirectoryHandle();

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      ...((globalThis as typeof globalThis & { navigator?: object }).navigator ?? {}),
      storage: {
        getDirectory: async () => root,
      },
    },
    writable: true,
    configurable: true,
  });
}
