import Base from '../model/base/Base.js'
import { changelogs } from '../model/version.js'
import lodash from 'lodash'
import YamlReader from '../utils/YamlReader.js'
export default class help extends Base {
    constructor() {
        super({
            name: 'help',
            priority: 50,
            rule: [
                {
                    reg: '^(#|)千羽帮助$',
                    fnc: 'help'
                },
                {
                    reg: '^(#|)千羽版本$',
                    fnc: 'version'
                },
                {
                    reg: '^(#|)千羽设置',
                    fnc: 'set'
                }
            ]
        })

        this.isCusHelp = false//是否自定义帮助
    }

    async init() {
        let data = this.Cfg
        let helplist = new YamlReader(`${this.Path.qianyuPath}config/default_config/help.config.yaml`).jsonData
        if (!this.isCusHelp && !lodash.isEqual(data.helplist, helplist)) {
            this.File.CopyFile('config/default_config/help.config.yaml', 'config/config/help.config.yaml')
            delete this.Config.Cfg['help']
        }
    }

    async help(e) {
        let data = this.Cfg
        if (!e.isMaster) {
            data.helplist.splice(data.helplist.length - 1, 1)
        }
        return this.reply(await this.render('help', data))
    }

    async version() {
        return this.reply(await this.render('version', { changelogs }))
    }

    async set(e) {
        if (!e.isMaster) return false
        let setKey = e.msg.replace("#千羽设置", "")
        let Cfg = {}
        let SetCfg = this.Config.GetCfg('set')
        let filterCfg = ['help', 'set']
        let filterList = ['ck', 'cookie', 'aiList']
        let configList = this.Config.config.filter(item => !filterCfg.includes(item))
        configList.forEach(item => {
            Cfg[item] = this.Config.GetCfg(item)
            Object.keys(Cfg[item]).map(key => {
                if (filterList.includes(key)) {
                    delete Cfg[item][key]
                }
            })
        })
        if (!e.isGroup) {
            if (setKey.includes("群")) {
                return this.reply("群里的设置不能私聊设置！");
            }
            Object.keys(SetCfg).forEach(item => SetCfg[item].hasOwnProperty('GroupSet') ? delete SetCfg[item].GroupSet : '')
        }
        let type = e.isGroup ? setKey.includes("群") ? 'GroupSet' : 'set' : 'set'
        let result = this.dealVaule(setKey, SetCfg, Cfg, type)
        if (result?.msg) {
            return this.reply(result.msg);
        } else {
            let adminList = Object.values(SetCfg).map(item => {
                item = {
                    title: item.title,
                    cfglist: [...Object.values(item.set), ...item.GroupSet ? Object.values(item.GroupSet) : []]
                }
                return item
            })
            return this.reply(await this.render('admin', { adminList: adminList }));
        }
    }

    dealVaule(setKey, SetCfg, Cfg, typeSet = 'set') {
        let result
        for (let c in SetCfg) {
            for (let s in SetCfg[c][typeSet]) {
                if (typeSet === 'GroupSet') {
                    SetCfg[c][typeSet][s].def = Cfg[c][this.e.group_id] ? Cfg[c][this.e.group_id][s] ? Cfg[c][this.e.group_id][s] : SetCfg[c][typeSet][s].def : SetCfg[c][typeSet][s].def
                } else {
                    SetCfg[c][typeSet][s].def = Cfg[c][s]
                }
                if (setKey && setKey.includes(SetCfg[c][typeSet][s].title)) {
                    let value = setKey.replace(SetCfg[c][typeSet][s].title, "")
                    //其他包喊得要处理
                    result = this.dealType(value, SetCfg[c][typeSet][s])
                    if (!result.msg) {
                        this.setValue(c, s, result.value, SetCfg, typeSet)
                    }
                }
            }
        }
        if (setKey && !result) {
            result = {
                msg: '无效设置！',
            }
        }
        return result
    }

    dealType(value, Obj) {
        let result = {
            msg: '',
            value: value
        }
        let isBolean = {
            开启: true,
            关闭: false
        }
        switch (Obj.type) {
            case 'Number':
                if (isNaN(value) && Obj.type === 'Number') {
                    result.msg = '设置的值必须是数字！'
                    break
                } else if (!isNaN(value) && Obj.range && value < Obj?.range[0] || value > Obj?.range[1]) {
                    result.msg = `数字范围不合理，值应该为${Obj?.range[0]}到${Obj?.range[1]}！`
                    break;
                }
                break;
            case 'Boolean':
                if (Object.keys(isBolean).includes(value)) {
                    result.value = isBolean[value]
                } else if (!Object.keys(isBolean).includes(value)) {
                    result.msg = '你要干什么值不对啊！'
                    break
                }
                break;
            case 'String':
                if (Obj.range && !Obj.range.includes(value)) {
                    result.msg = `只能设置为${Obj.range.join("、")}之中的一种！`
                    break;
                }
                break;
        }
        return result
    }

    setValue(name, key, value, SetCfg, typeSet) {
        if (this.e.isGroup && SetCfg[name].GroupSet && typeSet == 'GroupSet') {
            SetCfg[name].GroupSet[key].def = value
            this.Config.SetCfg(name, `${this.e.group_id}.${key}`, value)
        } else {
            SetCfg[name].set[key].def = value
            this.Config.SetCfg(name, key, value)
        }

    }
}
