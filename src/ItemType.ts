import { constants } from 'fs';

export enum ItemType {
    BlockDevice = constants.S_IFBLK,
    CharacterDevice = constants.S_IFCHR,
    Directory = constants.S_IFDIR,
    FIFO = constants.S_IFIFO,
    File = constants.S_IFREG,
    Socket = constants.S_IFSOCK,
    SymbolicLink = constants.S_IFLNK
}