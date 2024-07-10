import { readdirSync, Stats, write, writeFile } from "fs";


type LanguageEntry = [string, number];
type ExtensionType = {
    [key: string]: string;
  };

const fs = require('fs');
const rootPath: string = "C:\\Path\\To\\Code\\Directory"
const writePath: string = "C:\\Path\\To\\Stats\\Directory"
const exclusions: string[] = ["public", "build", "node_modules", "__pycache__", ".git", "debug", ".vscode",]
const codeExtensions: string[] = [".bat", ".c", ".clj", ".cljs", ".cpp", ".cs", ".css", ".go", ".hs", ".html", ".java", ".js", ".jsx", ".lua",".mjs", ".nim", ".pas", ".perl", ".php", ".pl", ".ps1", ".py", ".r", ".rkt", ".rs", ".sass", ".scala", ".scss", ".sh", ".sql", ".swift", ".tcl", ".ts", ".tsx", ".vhdl", ".xml", ".yaml", ".yml"];
const extensionMap: ExtensionType = {
    ".js": "javascript",
    ".css": "css",
    ".py": "python",
    ".html": "html",
    ".ps1": "powershell",
    ".ts": "typescript",
    ".c": "c",
    ".tsx": "typescriptx",
    ".go": "golang",
    ".rs": "rust",
    ".cpp": "cplusplus",
}

const omitTypescript = (file: string, allFiles: string[]): boolean => {
    let title = file.split(".")[0];//get the title of the js file
    for (let i = 0; i < allFiles.length; i++){
        let tempTitle = allFiles[i].split('.')[0]
        if ((tempTitle === title) && (allFiles[i].split('.')[1] == "ts")){//if TS file shares the same name as a javascript file then don't include the JS file.
            return true;//don't include JS files that have the same name as JS files
        }
    }
    return false;
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
            } else if (fileExt == "js") {
                if (omitTypescript(fileName, files)){
                    nonCodeFiles.push(fileName)
                }
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

const writeFiles = (data: Array<LanguageEntry>): void => {
    const headers = ["Number of Lines", "Date Logged", "Difference"]
    let i = 0;
    let tempData: LanguageEntry = data[i]//current language sorted by most amount of lines
    let numLines: number = tempData[1]//get the number of lines of chosen language

    let currDate: Date = new Date();
    let formattedDate: string = new Intl.DateTimeFormat('en-US').format(currDate).replace(/\//g, '-')//get the current date in mm-dd-yyyy format

    while (numLines != 0){
        let entrydata: string[] = [tempData[1].toString(), formattedDate]//num lines => date Logged => difference
        let fileName: string = extensionMap[tempData[0]] + "Lines.csv" //name of the file based off the extension (".js" => "javascriptLines")
        let fullpath: string = writePath + "\\" + fileName  //get the absolute path of the new file...
        let difference: string = "" 

        if (fs.existsSync(fullpath)){//if the file already exists, append to it and calculat ethe difference
            let tempFileData: string[] = fs.readFileSync(fullpath, "utf-8").split("\n")//read in the file to calculate the difference
            if (tempFileData.length > 1){
                let lastEntry: string = tempFileData[tempFileData.length - 2]//account for empty character at the end
                let lastNumber = lastEntry.split(',')[0]
                console.log(lastEntry, lastNumber)
                difference = (parseInt(entrydata[0]) - parseInt(lastNumber)).toString()
            } else {
                difference = entrydata[0]
            }
            entrydata.push(difference)
            fs.appendFileSync(fullpath, entrydata.join(",") + "\n");
            console.log('String appended to the existing file.');
        } else {//if the file doesn't exist, write the headers and set the difference to the number of lines
            difference = entrydata[0]
            entrydata.push(difference)
            fs.writeFileSync(fullpath, headers.join(",") + "\n");//write the CSV headers first
            fs.appendFileSync(fullpath, entrydata.join(",") + "\n");//write the data
            console.log('File written at: ', fullpath);
        }
        i++;
        tempData = data[i]
        numLines = tempData[1]
    }

}

const codeData = new Map();//initialize mapping of languages and lines
for (let i = 0; i < codeExtensions.length; i++) {
    codeData.set(codeExtensions[i], 0)
}

const files: string[] = getAllFiles(rootPath)
const numLines: number = getTotalLines(files)
const sortedArray = Array.from(codeData.entries()).sort((a, b) => b[1] - a[1])
console.log("Total Lines: ", numLines)
console.log(sortedArray)

writeFiles(sortedArray)
