import Filemage from '../../utils/Filemage.js'
import Path from './Path.js'
export default class Data {
    constructor(type) {
        this.type = type
        this.filemage = new Filemage(Path.qianyuPath + 'data/')
        this.filemage.CreatDir()
    }

    getDataJson(name) {
        if (!this.filemage.ExistsFile(`${name || this.type}.json`)) {
            return false
        }
        return this.filemage.getFileDataToJson(`${name || this.type}.json`)
    }

    setDataJson(data, name) {
        this.filemage.writeFileJsonData(`${name || this.type}.json`, data)
    }

    getData(path) {
        return this.filemage.getFileDataToJson(path)
    }
}
