import { FileSystem } from "../src";

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    let src = await FileSystem.getDirectory("./src");
    await src.open(async (dir) => {
        for await (let file of dir.getFileIterator()) {
            let res = await file.read("utf-8");
        }
        await wait(1000);
    })
}

main();