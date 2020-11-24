import { PathLike, promises, MakeDirectoryOptions, Dirent, OpenDirOptions, RmDirAsyncOptions, Dir, constants } from 'fs';
import { resolve } from 'path';
import { FileItemHandle } from './FileItemHandle';
import { ItemType } from './ItemType';


export class FileSystem {
    static async getItem(path: PathLike): Promise<FileSystemItem> {
        let s = await promises.lstat(path);
        return getItem(s.mode & constants.S_IFMT, path);
    }
    static async getDirectory(path: PathLike): Promise<Directory> {
        let item = await this.getItem(path);
        if (!item.isDirectory()) throw new Error();
        return item;
    }
    static async getFile(path: PathLike): Promise<File> {
        let item = await this.getItem(path);
        if (!item.isFile()) throw new Error();
        return item;
    }
    static async createDirectory(path: PathLike, options?: number | string | MakeDirectoryOptions | null) {
        await promises.mkdir(path, options);
        return new Directory(path);
    }
    static async createFile(path: PathLike, data: any, options?: { encoding?: string | null; mode?: string | number; flag?: string | number; } | string | null) {
        await promises.writeFile(path, data, options);
        return new File(path);
    }
    static async createTemporaryDirectory(prefix: string, options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    static async createTemporaryDirectory(prefix: string, options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    static async createTemporaryDirectory(...args: any[]): Promise<any> {
        let path = await promises.mkdtemp(...args as [any]);
        return new Directory(path);
    }
    static realPath(path: PathLike, options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    static realPath(path: PathLike, options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    static realPath(path: PathLike, options?: { encoding?: string | null; } | string | null): Promise<string | Buffer>;
    static realPath(...args: any[]): any {
        return promises.realpath(...args as [any]);
    }
}

export abstract class FileSystemItem {
    abstract readonly type: ItemType;
    private _path: PathLike;
    get path() {
        return this._path;
    }
    protected setPath(path: PathLike) {
        this._path = path;
    }
    constructor(path: PathLike) {
        if (typeof path === "string") {
            path = resolve(process.cwd(), path);
        }

        this._path = path;
    }
    isFile(): this is File {
        return this.type === ItemType.File;
    }
    isDirectory(): this is Directory {
        return this.type === ItemType.Directory;
    }
    isBlockDevice(): this is BlockDevice {
        return this.type === ItemType.BlockDevice;
    }
    isCharacterDevice(): this is CharacterDevice {
        return this.type === ItemType.CharacterDevice;
    }
    isSymbolicLink(): this is SymbolicLink {
        return this.type === ItemType.SymbolicLink;
    }
    isFIFO(): this is FIFO {
        return this.type === ItemType.FIFO;
    }
    isSocket(): this is Socket {
        return this.type === ItemType.Socket;
    }

    getState() {
        return promises.stat(this.path);
    }
    async createLink(path: PathLike) {
        await promises.link(this.path, path);
        return new (this.constructor as new (path: PathLike) => FileSystemItem)(path);
    }
    async createSymbolicLink(path: PathLike) {
        await promises.symlink(this.path, path);
        return new SymbolicLink(path);
    }
    changeMode(mode: string | number) {
        return promises.chmod(this.path, mode);
    }
    changeOwnership(uid: number, gid: number) {
        return promises.chown(this.path, uid, gid);
    }
    updateTimes(atime: string | number | Date, mtime: string | number | Date) {
        return promises.utimes(this.path, atime, mtime);
    }
    access(mode?: number) {
        return promises.access(this.path, mode);
    }
}

export abstract class FileLikeItem extends FileSystemItem {
    unlink() {
        return promises.unlink(this.path);
    }
    remove() {
        return promises.unlink(this.path);
    }


    read(options?: { encoding?: null; flag?: string | number; } | null): Promise<Buffer>;
    read(options: { encoding: BufferEncoding; flag?: string | number; } | BufferEncoding): Promise<string>;
    read(options?: { encoding?: BufferEncoding | null; flag?: string | number; } | string | null): Promise<string | Buffer>;
    read(...args: any[]): any {
        return promises.readFile(this.path, ...args);
    }

    copy(dest: PathLike, flags?: number) {
        return promises.copyFile(this.path, dest, flags);
    }
    async open(flags: string | number, mode: string | number, callback: (item: FileItemHandle) => Promise<void>): Promise<void>;
    async open(flags: string | number, callback: (item: FileItemHandle) => Promise<void>): Promise<void>;
    async open(...args: any[]): Promise<void> {
        let callback = args.pop();
        let fd = await promises.open(this.path, ...args as [any]);
        let item = new FileItemHandle(fd);
        try {
            await callback(item);
        } finally {
            await item.close();
        }
    }
    async rename(newPath: PathLike) {
        await promises.rename(this.path, newPath);
        this.setPath(newPath);
    }
    moveTo(newPath: PathLike) {
        return this.rename(newPath);
    }
    truncate(len?: number) {
        return promises.truncate(this.path, len);
    }
    write(data: any, options?: { encoding?: string | null; mode?: string | number; flag?: string | number; } | string | null) {
        return promises.writeFile(this.path, data, options);
    }
    append(data: any, options?: { encoding?: string | null; mode?: string | number; flag?: string | number; } | string | null) {
        return promises.appendFile(this.path, data, options);
    }
}

export class BlockDevice extends FileLikeItem {
    readonly type = ItemType.BlockDevice;
}

export class CharacterDevice extends FileLikeItem {
    readonly type = ItemType.CharacterDevice;
}

export class Directory extends FileSystemItem {
    readonly type = ItemType.Directory;
    remove(options?: RmDirAsyncOptions) {
        return promises.rmdir(this.path, options);
    }

    // todo, 返回值有商量
    read(options?: { encoding?: BufferEncoding | null; withFileTypes?: false; } | BufferEncoding | null): Promise<string[]>;
    read(options: { encoding: "buffer"; withFileTypes?: false; } | "buffer"): Promise<Buffer[]>;
    read(options?: { encoding?: string | null; withFileTypes?: false; } | string | null): Promise<string[] | Buffer[]>;
    read(options: { encoding?: string | null; withFileTypes: true; }): Promise<Dirent[]>;
    read(...args: any[]): any {
        return promises.readdir(this.path, ...args);
    }

    async open(options: OpenDirOptions, callback: (dir: DirectoryItemHandle) => Promise<void>): Promise<void>;
    async open(callback: (dir: DirectoryItemHandle) => Promise<void>): Promise<void>;
    async open(...args: any[]): Promise<void> {
        let callback = args.pop();
        let dir = await promises.opendir(this.path as string, ...args as [any]);
        let item = new DirectoryItemHandle(dir);
        try {
            await callback(item);
        } finally {
            try {
                await item.close();
            } catch { }
        }
    }
}

export class FIFO extends FileLikeItem {
    readonly type = ItemType.FIFO;
}

export class File extends FileLikeItem {
    readonly type = ItemType.File;
}

export class Socket extends FileLikeItem {
    readonly type = ItemType.Socket;
}

export class SymbolicLink extends FileSystemItem {
    readonly type = ItemType.SymbolicLink;
    getState() {
        return promises.lstat(this.path);
    }
    changeMode(mode: string | number) {
        return promises.lchmod(this.path, mode);
    }
    changeOwnership(uid: number, gid: number) {
        return promises.lchown(this.path, uid, gid);
    }
    readLink(options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    readLink(options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    readLink(options?: { encoding?: string | null; } | string | null): Promise<string | Buffer>;
    readLink(...args: any[]): any {
        return promises.readlink(this.path, ...args);
    }
    async getItem() {
        let path = await this.readLink();
        return await FileSystem.getItem(path);
    }
}


export class DirectoryItemHandle {
    private isClosed = false;
    constructor(private dir: Dir) { }
    get path() {
        return this.dir.path;
    }
    async read() {
        let dir = await this.dir.read();
        return dir ? this.getItem(dir) : null;
    }
    async close() {
        if (this.isClosed) return;
        await this.dir.close();
        this.isClosed = true;
    }
    async *[Symbol.asyncIterator](): AsyncIterableIterator<FileSystemItem> {
        for await (let it of this.dir) {
            yield this.getItem(it);
        }
    }

    async *getIteratorOf(type: ItemType): AsyncIterableIterator<FileSystemItem> {
        for await (let it of this.dir) {
            let itemType = this.getType(it);
            if (type === itemType) yield this.getItem(it);
        }
    }

    getFileIterator(): AsyncIterableIterator<File> {
        return this.getIteratorOf(ItemType.File) as any;
    }

    getDirectoryIterator(): AsyncIterableIterator<Directory> {
        return this.getIteratorOf(ItemType.Directory) as any;
    }

    private getItem(dir: Dirent) {
        let path = resolve(this.path, dir.name);;
        let type = this.getType(dir);
        return getItem(type, path);
    }

    private getType(dir: Dirent) {
        if (dir.isBlockDevice())
            return ItemType.BlockDevice;
        if (dir.isCharacterDevice())
            return ItemType.CharacterDevice;
        if (dir.isDirectory())
            return ItemType.Directory;
        if (dir.isFIFO())
            return ItemType.FIFO;
        if (dir.isFile())
            return ItemType.File;
        if (dir.isSocket())
            return ItemType.Socket;
        if (dir.isSymbolicLink())
            return ItemType.SymbolicLink;
        throw new Error();
    }
}

function getItem(type: ItemType, path: PathLike): FileSystemItem {
    switch (type) {
        case ItemType.BlockDevice: return new BlockDevice(path);
        case ItemType.CharacterDevice: return new CharacterDevice(path);
        case ItemType.Directory: return new Directory(path);
        case ItemType.FIFO: return new FIFO(path);
        case ItemType.File: return new File(path);
        case ItemType.Socket: return new Socket(path);
        case ItemType.SymbolicLink: return new SymbolicLink(path);
        default: throw new Error();
    }
}