import { promises, WriteVResult } from 'fs';


export class FileItemHandle {
    private isClosed = false;
    constructor(private fd: promises.FileHandle) { }
    changeMode(mode: string | number) {
        return this.fd.chmod(mode);
    }
    dataSync() {
        return this.fd.datasync();
    }
    sync() {
        return this.fd.sync();
    }
    getState() {
        return this.fd.stat();
    }
    async close() {
        if (this.isClosed) return;
        await this.fd.close();
        this.isClosed = true;
    }
    updateTimes(atime: string | number | Date, mtime: string | number | Date) {
        return this.fd.utimes(atime, mtime);
    }
    truncate(len?: number) {
        return this.fd.truncate(len);
    }
    append(data: any, options?: { encoding?: string | null; mode?: string | number; flag?: string | number; } | string | null) {
        return this.fd.appendFile(data, options);
    }
    read<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null) {
        return this.fd.read(buffer, offset, length, position);
    }
    write<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null): Promise<{ bytesWritten: number, buffer: TBuffer }>;
    write(data: any, position?: number | null, encoding?: string | null): Promise<{ bytesWritten: number, buffer: string }>;
    write(...args: any[]): any {
        return this.fd.write(...args as [any]);
    }
    writev(buffers: NodeJS.ArrayBufferView[], position?: number): Promise<WriteVResult> {
        return this.fd.writev(buffers, position);
    }
}
