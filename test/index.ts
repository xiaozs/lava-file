import { FileSystem } from "../src";

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    let src = await FileSystem.getDirectory("./src");
    let res = await src.read();
    console.log(res);
    debugger;
}

main();