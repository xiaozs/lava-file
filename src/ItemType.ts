import { constants } from 'fs';

/**
 * 文件系统对象类型
 */
export enum ItemType {
    /**
     * 块设备
     */
    BlockDevice = constants.S_IFBLK,
    /**
     * 字符设备
     */
    CharacterDevice = constants.S_IFCHR,
    /**
     * 文件系统目录
     */
    Directory = constants.S_IFDIR,
    /**
     * 先进先出（FIFO）管道
     */
    FIFO = constants.S_IFIFO,
    /**
     * 普通的文件
     */
    File = constants.S_IFREG,
    /**
     * 套接字
     */
    Socket = constants.S_IFSOCK,
    /**
     * 符号链接
     */
    SymbolicLink = constants.S_IFLNK
}