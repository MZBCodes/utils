import { readdirSync, Stats } from "fs";

const fs = require('fs');
const rootPath = "C:\\Path_To_Your_Code_Directory"
const exclusions = ["public", "build", "node_modules", "__pycache__", ".git", "debug", ".vscode",]
const codeExtensions = [".bat", ".c", ".clj", ".cljs", ".coffee", ".cpp", ".cs", ".css", ".dart", ".erl", ".ex", ".exs", ".f", ".f90", ".f95", ".go", ".groovy", ".h", ".hpp", ".hs", ".html", ".java", ".jl", ".js", ".jsx", ".kt", ".less", ".lisp", ".lua", ".m", ".m4", ".mjs", ".nim", ".pas", ".perl", ".php", ".pl", ".pp", ".ps1", ".py", ".r", ".rkt", ".rs", ".sass", ".scala", ".scss", ".sh", ".sql", ".swift", ".tcl", ".ts", ".tsx", ".v", ".vhdl", ".vue", ".xml", ".yaml", ".yml"];
const codeData = new Map();
for (let i = 0; i < codeExtensions.length; i++) {
    codeData.set(codeExtensions[i], 0)
}

const filterCodeFiles = (files: string[]): string[] => {
    let nonCodeFiles: string[] = []
    for (let i = 0; i < files.length; i++) {
        let fileName: string = files[i];
        let fileSplit: string[] = fileName.split('.');
        let fileExt: string = (fileSplit.length > 1 ? fileSplit[1] : "")
        if (fileExt) {
            if (!codeExtensions.includes("." + fileExt)) {
                nonCodeFiles.push(fileName)
            }
        } else {
            nonCodeFiles.push(fileName)
        }
    }
    files = files.filter((e) => !(nonCodeFiles.includes(e)))
    return files;
}

const getAllFiles = (path: string): string[] => {
    let items: string[] = []
    if (fs.statSync(path).isDirectory()) {
        items = readdirSync(path);//files and paths
    } else {
        return []
    }
    let allFiles = []
    let tempdirs: string[] = filterDir(items.map(e => path + "\\" + e))
    let files: string[] = filterCodeFiles(items.map(e => path + "\\" + e))
    // console.log(tempdirs, files)
    if (tempdirs.length == 0) {
        return files
    }
    allFiles.push(...files)
    for (let i = 0; i < tempdirs.length; i++) {
        allFiles.push(...getAllFiles(tempdirs[i]))
    }
    return allFiles
}


const filterDir = (files: string[]): string[] => {
    let nonDirs: string[] = []
    for (let i = 0; i < files.length; i++) {
        let stats: any = null
        try {
            stats = fs.statSync(files[i])
            if (!stats.isDirectory()) {
                nonDirs.push(files[i])
            }
        } catch (error) {
            console.error(error)
        }
    }
    files = files.filter((e) => !nonDirs.includes(e))
    files = files.filter((e) => filterString(e, exclusions))
    return files;
}
//if any of the words in excl appears in str, remove it
const filterString = (str: string, excl: string[]): boolean => {
    for (let i = 0; i < excl.length; i++) {
        if (str.includes(excl[i])) {
            return false
        }
    }
    return true
}

const getAllDirs = (path: string): string[] => {
    let items: string[] = []
    if (fs.statSync(path).isDirectory()) {
        items = readdirSync(path);
    } else {
        return []
    }
    let allDirs = []
    let tempdirs: string[] = filterDir(items.map(e => path + "\\" + e))
    if (tempdirs.length == 0) {
        return []
    }
    allDirs.push(...tempdirs)
    for (let i = 0; i < tempdirs.length; i++) {
        allDirs.push(...getAllDirs(tempdirs[i]))
    }
    return allDirs
}

const getFileLineLength = (filePath: string): number => {
    let file = fs.statSync(filePath);
    let contents = fs.readFileSync(filePath, "utf-8");
    let lines: string[] = contents.split("\n")
    return lines.length
}

const getTotalLines = (files: string[]): number => {
    let sum: number = 0;
    for (let i = 0; i < files.length; i++) {
        let tempNum = getFileLineLength(files[i])
        sum += tempNum
        let ext: string = files[i].split('.')[1]
        codeData.set("." + ext, codeData.get("." + ext) + tempNum)
    }
    return sum
}
const files: string[] = getAllFiles(rootPath)
const numLines: number = getTotalLines(files)
console.log("Total Lines: ", numLines)
console.log(Array.from(codeData.entries()).sort((a, b) => b[1] - a[1]))
console.log("test")
