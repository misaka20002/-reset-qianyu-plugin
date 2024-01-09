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
        this.file = new Filemage(Path.qianyuPath)
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
        //复制不同文件
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
        return this.getCfgList(this.defCfg_path)
    }

    get config() {
        return this.getCfgList(this.cfg_path)
    }

    getCfgList(cfg_path) {
        let cfglist = []
        this.file.GetfileList(cfg_path, true).map((item) => {
            if (item.isDirectory()) {
                this.file.GetfileList(`${cfg_path}/${item.name}`).filter(i => i.endsWith('.yaml')).map((m) => {
                    cfglist.push(`${item.name}.${m.replace('.config.yaml', "")}`)
                })
            } else if (item.name.endsWith('.yaml')) {
                cfglist.push(item.name.replace('.config.yaml', ""))
            }
        })
        return cfglist
    }

    //复制不同的key
    CopyDifference() {
        for (let d of this.default_config) {
            let defultData, data;
            if (d.includes(".")) {
                let dlist = d.replace('.', "/")
                defultData = new YamlReader(`${Path.qianyuPath}${this.defCfg_path}/${dlist}.config.yaml`).jsonData
                data = new YamlReader(`${Path.qianyuPath}${this.cfg_path}/${dlist}.config.yaml`).jsonData
            } else {
                defultData = new YamlReader(`${Path.qianyuPath}${this.defCfg_path}/${d}.config.yaml`).jsonData
                data = new YamlReader(`${Path.qianyuPath}${this.cfg_path}/${d}.config.yaml`).jsonData
            }
            let keylist = this.differenceKey(defultData, data)
            for (let k of keylist) {
                if (!defultData) continue
                this.SetCfg(d, k, defultData[k])
            }
        }
    }

    GetCfg(name = '', config = 'config') {
        config = config === 'config' ? this.cfg_path : this.defCfg_path
        let path = name.includes(".") ? name.replace(".", "/") : name
        if (this.Cfg[name]) return this.Cfg[name].jsonData
        this.Cfg[name] = new YamlReader(`${Path.qianyuPath}${config}/${path}.config.yaml`)
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

    //数组添加数据
    AddCfg(name, key, value) {
        if (!this.Cfg[name]) {
            this.GetCfg(name)
        }
        this.Cfg[name].addIn(key, value)
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
