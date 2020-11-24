import { PathLike, promises, MakeDirectoryOptions, Dirent, OpenDirOptions, Dir, constants, RmDirOptions } from 'fs';
import { resolve } from 'path';
import { FileItemHandle, WriteOption } from './FileItemHandle';
import { ItemType } from './ItemType';

/**
 * 文件类型不匹配
 */
export class TypeNotMatchError extends Error {
    constructor() {
        super("文件类型不匹配");
        Object.setPrototypeOf(this, this.constructor.prototype);
    }
}

/**
 * 文件系统
 */
export class FileSystem {
    /**
     * 从已有的文件系统项目中创建对象
     * @param path 路径
     */
    static async getItem(path: PathLike): Promise<FileSystemItem> {
        let s = await promises.lstat(path);
        return getItem(s.mode & constants.S_IFMT, path);
    }
    /**
     * 从已有的文件夹中创建对象
     * @throws 路径不为文件夹时，抛出`TypeNotMatchError`
     * @param path 路径
     */
    static async getDirectory(path: PathLike): Promise<Directory> {
        let item = await this.getItem(path);
        if (!item.isDirectory()) throw new TypeNotMatchError();
        return item;
    }
    /**
     * 从已有的普通文件中创建对象
     * @throws 路径不为文件夹时，抛出`TypeNotMatchError`
     * @param path 路径
     */
    static async getFile(path: PathLike): Promise<File> {
        let item = await this.getItem(path);
        if (!item.isFile()) throw new TypeNotMatchError();
        return item;
    }
    /**
     * 新增文件夹
     * @param path 路径
     * @param options 新增选项
     */
    static async createDirectory(path: PathLike, options?: number | string | MakeDirectoryOptions | null) {
        await promises.mkdir(path, options);
        return new Directory(path);
    }
    /**
     * 新增普通文件
     * @param path 路径
     * @param data 初始数据
     * @param options 新增选项
     */
    static async createFile(path: PathLike, data: any, options?: { encoding?: string | null; mode?: string | number; flag?: string | number; } | string | null) {
        await promises.writeFile(path, data, options);
        return new File(path);
    }
    /**
     * 新增临时文件夹
     * @param prefix 前缀
     * @param options 新增选项
     */
    static async createTemporaryDirectory(prefix: string, options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    static async createTemporaryDirectory(prefix: string, options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    static async createTemporaryDirectory(...args: any[]): Promise<any> {
        let path = await promises.mkdtemp(...args as [any]);
        return new Directory(path);
    }
    /**
     * 将相对路径转换成绝对路径
     * @param path 路径
     * @param options 选项
     */
    static realPath(path: PathLike, options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    static realPath(path: PathLike, options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    static realPath(path: PathLike, options?: { encoding?: string | null; } | string | null): Promise<string | Buffer>;
    static realPath(...args: any[]): any {
        return promises.realpath(...args as [any]);
    }
}

/**
 * 文件系统对象
 */
export abstract class FileSystemItem {
    /**
     * 文件系统对象类型
     */
    abstract readonly type: ItemType;
    /**
     * 路径
     */
    private _path: PathLike;
    /**
     * 路径
     */
    get path() {
        return this._path;
    }
    /**
     * 设置路径
     * @param path 路径
     */
    protected setPath(path: PathLike) {
        this._path = path;
    }
    /**
     * @param path 路径
     */
    constructor(path: PathLike) {
        if (typeof path === "string") {
            path = resolve(process.cwd(), path);
        }

        this._path = path;
    }
    /**
     * 是否普通文件
     */
    isFile(): this is File {
        return this.type === ItemType.File;
    }
    /**
     * 是否文件夹
     */
    isDirectory(): this is Directory {
        return this.type === ItemType.Directory;
    }
    /**
     * 是否块设备
     */
    isBlockDevice(): this is BlockDevice {
        return this.type === ItemType.BlockDevice;
    }
    /**
     * 是否字符设备
     */
    isCharacterDevice(): this is CharacterDevice {
        return this.type === ItemType.CharacterDevice;
    }
    /**
     * 是否符号链接
     */
    isSymbolicLink(): this is SymbolicLink {
        return this.type === ItemType.SymbolicLink;
    }
    /**
     * 先进先出（FIFO）管道
     */
    isFIFO(): this is FIFO {
        return this.type === ItemType.FIFO;
    }
    /**
     * 套接字
     */
    isSocket(): this is Socket {
        return this.type === ItemType.Socket;
    }
    /**
     * 获取状态
     */
    getStatus() {
        return promises.stat(this.path);
    }
    /**
     * 在目标路径新建一个硬链接
     * @param path 目标路径
     */
    async createLink(path: PathLike) {
        // todo，路径是相对与cwd的，有点怪
        await promises.link(this.path, path);
        return new (this.constructor as new (path: PathLike) => FileSystemItem)(path);
    }
    /**
     * 在目标路径新建一个硬符号
     * @param path 目标路径
     */
    async createSymbolicLink(path: PathLike) {
        // todo，路径是相对与cwd的，有点怪
        await promises.symlink(this.path, path);
        return new SymbolicLink(path);
    }
    /**
     * 更改权限
     * @param mode 权限模式，
     */
    changeMode(mode: string | number) {
        // todo
        return promises.chmod(this.path, mode);
    }
    /**
     * 更改所有权
     * @param uid 用户id
     * @param gid 组id
     */
    changeOwnership(uid: number, gid: number) {
        return promises.chown(this.path, uid, gid);
    }
    /**
     * 更改系统时间戳
     * @param atime 上次访问的时间戳
     * @param mtime 上次修改的时间戳
     */
    updateTimes(atime: string | number | Date, mtime: string | number | Date) {
        return promises.utimes(this.path, atime, mtime);
    }
    /**
     * 测试访问权限
     * @param mode 路径
     */
    access(mode?: number) {
        return promises.access(this.path, mode);
    }
}

/**
 * 可以进行类似于普通文件操作的对象
 */
export abstract class FileLikeItem extends FileSystemItem {
    /**
     * 删除文件
     */
    unlink() {
        return promises.unlink(this.path);
    }
    /**
     * 删除文件
     */
    remove() {
        return promises.unlink(this.path);
    }

    /**
     * 读取整个文件
     * @param options 读取选项
     */
    read(options?: { encoding?: null; flag?: string | number; } | null): Promise<Buffer>;
    read(options: { encoding: BufferEncoding; flag?: string | number; } | BufferEncoding): Promise<string>;
    read(options?: { encoding?: BufferEncoding | null; flag?: string | number; } | string | null): Promise<string | Buffer>;
    read(...args: any[]): any {
        return promises.readFile(this.path, ...args);
    }

    /**
     * 复制文件到目标路径
     * @param dest 目标路径
     */
    copy(dest: PathLike) {
        return promises.copyFile(this.path, dest);
    }

    /**
     * 打开或者新建一个文件
     * @param flags 文件系统标志
     * @param mode 新建文件的权限，默认为`0o666`
     * @param callback 回调
     */
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
    /**
     * 改变文件的路径或名称
     * @param newPath 新路径或名称
     */
    async rename(newPath: PathLike) {
        await promises.rename(this.path, newPath);
        this.setPath(newPath);
    }
    /**
     * 改变文件的路径或名称
     * @param newPath 新路径或名称
     */
    moveTo(newPath: PathLike) {
        return this.rename(newPath);
    }
    /**
     * 将文件截断为特定长度
     * @param len 截断长度，默认为0
     */
    truncate(len?: number) {
        return promises.truncate(this.path, len);
    }
    /**
     * 
     * @param data 数据
     * @param options 写入选项
     */
    write(data: any, options?: WriteOption | string | null) {
        return promises.writeFile(this.path, data, options);
    }
    /**
     * 增补数据到文件，文件不存在时会新建文件
     * @param data 写入的数据
     * @param options 写入选项
     */
    append(data: any, options?: WriteOption | string | null) {
        return promises.appendFile(this.path, data, options);
    }
}

/**
 * 块设备
 */
export class BlockDevice extends FileLikeItem {
    readonly type = ItemType.BlockDevice;
}

/**
 * 字符设备
 */
export class CharacterDevice extends FileLikeItem {
    readonly type = ItemType.CharacterDevice;
}

/**
 * 文件夹
 */
export class Directory extends FileSystemItem {
    readonly type = ItemType.Directory;
    /**
     * 删除文件夹
     * @param options 删除选项
     */
    remove(options?: RmDirOptions) {
        return promises.rmdir(this.path, options);
    }

    /**
     * 获取子项目对象
     * @param options 读取选项
     */
    async read(): Promise<FileSystemItem[]> {
        let res = await promises.readdir(this.path, { withFileTypes: true });
        let paths = res.map(it => resolve(this.path.toString(), it.name));
        let pArr = paths.map(it => FileSystem.getItem(it));
        return await Promise.all(pArr);
    }

    /**
     * 读取文件夹
     * @param options 读取选项
     * @param callback 回调
     */
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

/**
 * 先进先出（FIFO）管道
 */
export class FIFO extends FileLikeItem {
    readonly type = ItemType.FIFO;
}

/**
 * 普通的文件
 */
export class File extends FileLikeItem {
    readonly type = ItemType.File;
}

/**
 * 套接字
 */
export class Socket extends FileLikeItem {
    readonly type = ItemType.Socket;
}

/**
 * 符号链接
 */
export class SymbolicLink extends FileSystemItem {
    readonly type = ItemType.SymbolicLink;
    /**
     * 获取**符号链接自身**的状态
     */
    getStatus() {
        return promises.lstat(this.path);
    }
    /**
     * 更改**符号链接自身**的权限
     * @param mode 权限模式，
     */
    changeMode(mode: string | number) {
        return promises.lchmod(this.path, mode);
    }
    /**
     * 更改**符号链接自身**的所有权
     * @param uid 用户id
     * @param gid 组id
     */
    changeOwnership(uid: number, gid: number) {
        return promises.lchown(this.path, uid, gid);
    }
    /**
     * 读取链接指向的路径
     * @param options 读取选项
     */
    readLink(options?: { encoding?: BufferEncoding | null; } | BufferEncoding | null): Promise<string>;
    readLink(options: { encoding: "buffer"; } | "buffer"): Promise<Buffer>;
    readLink(options?: { encoding?: string | null; } | string | null): Promise<string | Buffer>;
    readLink(...args: any[]): any {
        return promises.readlink(this.path, ...args);
    }
    /**
     * 获取指向路径的对象
     */
    async getItem() {
        let path = await this.readLink();
        return await FileSystem.getItem(path);
    }
}

/**
 * 由`open`方法的回调返回的文件夹处理句柄
 */
export class DirectoryItemHandle {
    /**
     * 文件夹是否已经被关闭
     */
    private isClosed = false;
    /**
     * @param dir nodejs原生文件夹处理句柄
     */
    constructor(private dir: Dir) { }
    /**
     * 路径
     */
    get path() {
        return this.dir.path;
    }
    /**
     * 返回下一个子项目
     */
    async read() {
        let dir = await this.dir.read();
        return dir ? this.getItem(dir) : null;
    }
    /**
     * 关闭文件夹
     */
    async close() {
        if (this.isClosed) return;
        await this.dir.close();
        this.isClosed = true;
    }

    /**
     * 迭代器，迭代文件夹子项目
     */
    async *[Symbol.asyncIterator](): AsyncIterableIterator<FileSystemItem> {
        for await (let it of this.dir) {
            yield this.getItem(it);
        }
    }

    /**
     * 迭代器，迭代特定类型子项目
     * @param type 特定类型
     */
    async *getIteratorOf(type: ItemType): AsyncIterableIterator<FileSystemItem> {
        for await (let it of this.dir) {
            let itemType = this.getType(it);
            if (type === itemType) yield this.getItem(it);
        }
    }

    /**
     * 迭代器，迭代普通文件
     */
    getFileIterator(): AsyncIterableIterator<File> {
        return this.getIteratorOf(ItemType.File) as any;
    }

    /**
     * 迭代器，迭代子文件夹
     */
    getDirectoryIterator(): AsyncIterableIterator<Directory> {
        return this.getIteratorOf(ItemType.Directory) as any;
    }

    /**
     * 转换dir为文件系统对象
     * @param dir nodejs原生文件夹处理句柄
     */
    private getItem(dir: Dirent) {
        let path = resolve(this.path, dir.name);;
        let type = this.getType(dir);
        return getItem(type, path);
    }
    /**
     * 获取dir类型
     * @param dir nodejs原生文件夹处理句柄
     */
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

/**
 * 创建文件系统对象
 * @param type 类型
 * @param path 路径
 */
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