import fs from 'fs'
import PATH from 'path'
import YamlReader from './YamlReader.js'
export default class Filemage {

    constructor(RootPath) {
        this.RootPath = RootPath || process.cwd()
    }

    //获取文件内容
    getFileData(path, type = 'utf-8') {
        return fs.readFileSync(this.RootPath + path, { encoding: type })
    }

    getFileDataToJson(fileName, type = 'utf-8') {
        return JSON.parse(fs.readFileSync(this.RootPath + fileName, { encoding: type }) || null)
    }

    getYamlData(path) {
        return new YamlReader(this.RootPath + path).jsonData
    }

    writeFile(fileName, data) {
        return fs.writeFileSync(this.RootPath + fileName, data)
    }

    writeFileJsonData(fileName, data) {
        return fs.writeFileSync(this.RootPath + fileName, JSON.stringify(data))
    }


    //获取文件列表
    GetfileList(path = '', withFileTypes = false) {
        return fs.readdirSync(this.RootPath + path, { withFileTypes: withFileTypes })
    }

    //创建文件夹
    CreatDir(path = '') {
        if (!fs.existsSync(this.RootPath + path)) {
            fs.mkdirSync(this.RootPath + path)
        }
    }

    //删除文件夹
    DeleteFile(path = '') {
        //防止误删
        if (!path) return
        if (fs.statSync(this.RootPath + path).isDirectory()) {
            fs.rmdirSync(this.RootPath + path)
        } else {
            fs.unlinkSync(this.RootPath + path)
        }
    }

    //移动文件
    RemoveFile(oldPath = '', newPath = '') {
        fs.renameSync(this.RootPath + oldPath, this.RootPath + newPath)
    }

    CopyFile(copyFile = '', newPath = '') {
        fs.copyFileSync(this.RootPath + copyFile, this.RootPath + newPath)
    }

    isDirectory(path) {
        return fs.statSync(this.RootPath + path).isDirectory()
    }

    //复制整个文件夹
    CopyDir(copyPath = '', newPath = '') {
        let files = this.GetfileList(copyPath, true)
        if (!this.ExistsFile(this.RootPath + newPath)) {
            this.CreatDir(newPath)
        }
        for (let f of files) {
            let c = PATH.join(copyPath, f.name)
            let p = PATH.join(newPath, f.name)
            if (fs.statSync(this.RootPath + c).isDirectory()) {
                this.CreatDir(p)
                this.CopyDir(c, p)
            } else {
                this.CopyFile(c, p)
            }
        }
    }

    deleteFile(path = '') {
        fs.unlinkSync(path)
    }

    //删除所有文件
    DeleteAllFile(path = '') {
        if (!path) return
        let fileList = this.GetfileList(path)
        for (let f of fileList) {
            let newPath = path + '/' + f
            if (fs.statSync(this.RootPath + newPath).isDirectory()) {
                this.DeleteAllFile(newPath)
            } else {
                this.DeleteFile(newPath)
            }
        }
        this.DeleteFile(path)
    }

    //是否存在文件或者路径
    ExistsFile(path = '') {
        return fs.existsSync(this.RootPath + path)
    }

    //查询文件地址
    SearchFile(name = '', filepath = '') {
        if (!name) return
        let fileList = this.GetfileList(filepath)
        if (fileList.length == 0) return
        if (fileList.includes(name)) {
            return PATH.join(this.RootPath, filepath)
        } else {
            for (let f of fileList) {
                let newPath = filepath ? filepath + '/' + f : '/' + f
                if (fs.statSync(this.RootPath + newPath).isDirectory()) {
                    if (this.SearchFile(name, newPath)) {
                        return PATH.join(this.RootPath, newPath)
                    }
                }
            }
            return false
        }

    }

}
