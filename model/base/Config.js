import Filemage from '../../utils/Filemage.js'
import YamlReader from '../../utils/YamlReader.js'
import chokidar from 'chokidar'
import Path from './Path.js'
import _ from 'lodash'
let pluginName = 'reset-qianyu-plugin'
class Config {
    constructor(isWatcher = false) {
        this.Cfg = {}//配置存储
        this.Watcher = {}//修改监听
        this.isWatcher = isWatcher
        this.file = new Filemage()
        this.cfg_path = '/config/config'
        this.defCfg_path = '/config/default_config'
        this.init()//初始化
    }

    init() {
        if (!this.file.ExistsFile(this.cfg_path)) {
            this.file.CreatDir(this.cfg_path)
            this.file.CopyDir(this.defCfg_path, this.cfg_path)
            return
        }
        const copyDifferFile = (path, path2) => {
            let list1 = this.file.GetfileList(path)
            let list2 = this.file.GetfileList(path2)
            //处理没有的文件或者文件夹
            let differlist = _.difference(list1, list2)
            for (let d of differlist) {
                if (this.file.isDirectory(`${path}/${d}`)) {
                    this.file.CopyDir(`${path}/${d}`, `${path2}/${d}`)
                } else {
                    this.file.CopyFile(`${path}/${d}`, `${path2}/${d}`)
                }
            }

            //存在文件夹的情况
            for (let l of list1) {
                if (this.file.isDirectory(`${path}/${l}`)) {
                    let l1 = this.file.GetfileList(`${path}/${l}`)
                    let l2 = this.file.GetfileList(`${path2}/${l}`)
                    let dlist = _.difference(l1, l2)
                    for (let d of dlist) {
                        this.file.CopyFile(`${path}/${l}/${d}`, `${path2}/${l}/${d}`)
                    }
                }
            }
        }
        copyDifferFile(this.defCfg_path, this.cfg_path)

        this.CopyDifference()
    }

    get package() {
        return this.file.getFileDataToJson('package.json')
    }

    get default_config() {
        return this.file.GetfileList(this.defCfg_path).filter((item) => item.endsWith('.yaml')).map((item) => { return item.replace('.config.yaml', "") })
    }

    get config() {
        return this.file.GetfileList(this.cfg_path).filter((item) => item.endsWith('.yaml')).map((item) => { return item.replace('.config.yaml', "") })
    }

    CopyDifference() {
        for (let d of this.default_config) {
            let defultData = new YamlReader(`${Path.qianyuPath}${this.defCfg_path}/${d}.config.yaml`).jsonData
            let data = new YamlReader(`${Path.qianyuPath}${this.cfg_path}/${d}.config.yaml`).jsonData
            let keylist = this.differenceKey(defultData, data)
            for (let k of keylist) {
                if (!defultData) continue
                this.SetCfg(d, k, defultData[k])
            }
        }
    }

    GetCfg(name = '', config = 'config') {
        config = config === 'config' ? this.cfg_path : this.defCfg_path
        let path = `${config}/${name}.config.yaml`
        if (this.Cfg[name]) return this.Cfg[name].jsonData
        if (!this.file.ExistsFile(path)) {
            this.Cfg[name] = new YamlReader(`${Path.qianyuPath}${config}/${this.dir + '/' + name}.config.yaml`)
        } else {
            this.Cfg[name] = new YamlReader(`${Path.qianyuPath}${config}/${name}.config.yaml`)
        }

        if (this.isWatcher && !this.Watcher[name]) {
            this.watch(name)
        }
        return this.Cfg[name].jsonData
    }

    SetCfg(name, key, value) {
        if (!this.Cfg[name]) {
            this.GetCfg(name)
        }
        this.Cfg[name].set(key, value)
    }


    watch(name) {
        this.Watcher[name] = chokidar.watch(`./plugins/${pluginName}/${this.cfg_path}/${name}.config.yaml`).on('change', () => {
            delete this.Cfg[name]
            console.log("修改了配置文件" + name);
            this.GetCfg(name)
        })
    }

    differenceKey(object = {}, base = {}) {
        if (!object) { return _.keys(base) }
        if (!base) { return _.keys(object) }
        const changes = (args1, args2) => {
            return _.difference(args1, args2)
        }
        return changes(_.keys(object), _.keys(base))
    }

}

export default new Config(true)