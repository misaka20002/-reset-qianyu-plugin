import Base from '../model/base/Base.js'
export default class controller extends Base {
    constructor() {
        super({
            name: 'controller',
            priority: -100,
            rule: [
                {
                    reg: '^#千羽(关机|开机)',
                    fnc: 'qianyuonoff'
                },
                {
                    reg: '^#千羽管理',
                    fnc: 'control'
                },
                {
                    reg: '^#千羽群功能',
                    fnc: 'Groupcontrol'
                },
            ],
        })
    }

    async control(e) {
        if (!e.isMaster) return false
        let key = e.msg.replace("#千羽管理", "")
        let ignore = ['controller', 'help', 'update']
        let noapp = this.Config.GetCfg('system/apps').noapp || []
        let applist = this.File.GetfileList('apps').map(item => item.replace('.js', "")).filter(item => !ignore.includes(item))
        if (!key) {
            let msg = '——千羽管理终端为您服务——\n当前共有以下功能js:'
            applist.forEach(item => {
                if (!ignore.includes(item)) {
                    msg += `\n— [${item}]${noapp.includes(item) ? '(已禁用)' : ''}`
                }
            })
            msg += '\n您可以通过#千羽管理禁用/开启+name禁用/开启当前js功能'
            this.reply(msg)
        }

        if (key.includes("禁用")) {
            let value = key.replace("禁用", "")
            if (!applist.includes(value)) {
                return this.reply(`不存在名为${value}的js！`)
            }
            if (noapp.includes(value)) {
                return this.reply("该功能已经被禁用过了！")
            } else {
                noapp.push(value)
            }
            this.Config.SetCfg('system/apps', 'noapp', noapp)
            return this.reply("功能禁用成功！即刻生效！")
        }

        if (key.includes("开启")) {
            let value = key.replace("开启", "")
            if (!applist.includes(value)) {
                return this.reply(`${value}的js还没被禁用！`)
            }
            if (noapp.includes(value)) {
                noapp = noapp.filter(item => item !== value)
            }
            this.Config.SetCfg('system/apps', 'noapp', noapp)
            return this.reply("功能开启成功！即刻生效！")
        }

    }

    async qianyuonoff(e) {
        if (!e.isMaster) return false
        let onoff = e.msg.replace("#千羽", "")
        this.Config.SetCfg('system/apps', 'isonoff', onoff === '开机' ? false : true)
        this.reply(`千羽插件已${onoff}!`)
    }

    async Groupcontrol(e) {
        if (!e.isMaster) return false
        let onoff = e.msg.replace("#千羽群功能", "")
        let filterGroup = this.Config.GetCfg('system/apps').filterGroup || []
        if (onoff === '关闭') {
            if (!filterGroup.includes(e.group_id)) {
                filterGroup.push(e.group_id)
            }
        } else {
            filterGroup = filterGroup.filter(item => item !== e.group_id)
        }
        this.Config.SetCfg('system/apps', 'filterGroup', filterGroup)
        this.reply(`千羽群功能已${onoff}!`)
    }
}