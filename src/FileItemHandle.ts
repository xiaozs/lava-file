import { promises, WriteVResult } from 'fs';

/**
 * 写入选项
 */
export interface WriteOption {
    /**
     * 数据编码，默认为`utf-8`
     */
    encoding?: string | null;
    /**
     * 新增文件时的权限，默认为`0o666`
     */
    mode?: string | number;
    /**
     * 文件系统标志，`write`默认为`"a"`，`append`默认为`"w"`
     */
    flag?: string | number;
}

/**
 * 由`open`方法的回调返回的文件处理句柄
 */
export class FileItemHandle {
    /**
     * 文件是否已经关闭
     */
    private isClosed = false;
    /**
     * @param fd nodejs原生文件处理句柄
     */
    constructor(private fd: promises.FileHandle) { }
    /**
     * 更改文件的权限
     * @param mode 文件的模式，
     */
    changeMode(mode: string | number) {
        // todo, 这个接口太难用了
        return this.fd.chmod(mode);
    }
    /**
     * 刷新数据到磁盘，可能包括文件描述信息
     */
    dataSync() {
        return this.fd.datasync();
    }
    /**
     * 刷新数据到磁盘，包括文件描述信息
     */
    sync() {
        return this.fd.sync();
    }
    /**
     * 获取文件状态
     */
    getStatus() {
        return this.fd.stat();
    }
    /**
     * 关闭文件
     */
    async close() {
        if (this.isClosed) return;
        await this.fd.close();
        this.isClosed = true;
    }
    /**
     * 更改文件的系统时间戳
     * @param atime 上次访问此文件的时间戳
     * @param mtime 上次修改此文件的时间戳
     */
    updateTimes(atime: string | number | Date, mtime: string | number | Date) {
        return this.fd.utimes(atime, mtime);
    }
    /**
     * 将文件截断为特定长度
     * @param len 截断长度，默认为0
     */
    truncate(len?: number) {
        return this.fd.truncate(len);
    }
    /**
     * 增补数据到文件，文件不存在时会新建文件
     * @param data 写入的数据
     * @param options 写入选项
     */
    append(data: any, options?: WriteOption | string | null) {
        return this.fd.appendFile(data, options);
    }
    /**
     * 从文件中读取数据
     * @param buffer 要被写入的buffer
     * @param offset buffer开始写入的偏移量
     * @param length 读取的字节数
     * @param position 参数指定从文件中开始读取的位置。如果 position 为 null，则从当前文件位置读取数据，并更新文件位置。 如果 position 是整数，则文件位置会保持不变。
     */
    read<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null) {
        return this.fd.read(buffer, offset, length, position);
    }
    /**
     * 写入buffer到文件
     * @param buffer 要被写入的buffer
     * @param offset 决定buffer中要被写入的部位
     * @param length 指定要写入的字节数
     * @param position 指定文件开头的偏移量（数据要被写入的位置）如果`typeof position !== 'number'`，则数据会被写入当前的位置。
     */
    write<TBuffer extends Uint8Array>(buffer: TBuffer, offset?: number | null, length?: number | null, position?: number | null): Promise<{ bytesWritten: number, buffer: TBuffer }>;
    /**
     * 将string写入到文件
     * @param data 字符串
     * @param position 指定文件开头的偏移量（数据要被写入的位置）。 如果 position 的类型不是一个 number，则数据会被写入当前的位置。
     * @param encoding 期望的字符串编码
     */
    write(data: string, position?: number | null, encoding?: string | null): Promise<{ bytesWritten: number, buffer: string }>;
    write(...args: any[]): any {
        return this.fd.write(...args as [any]);
    }
    /**
     * 将buffers数组写入该文件
     * @param buffers 要被写入的buffer数组
     * @param position 指定文件开头的偏移量（数据要被写入的位置）。 如果 typeof position !== 'number'，则数据会被写入当前的位置。
     */
    writev(buffers: NodeJS.ArrayBufferView[], position?: number): Promise<WriteVResult> {
        return this.fd.writev(buffers, position);
    }
}
