import Base from '../model/base/Base.js'
import YamlReader from '../utils/YamlReader.js'
export default class prefix extends Base {
    constructor() {
        super({
            name: 'prefix',
            priority: 50,
            rule: [
                {
                    reg: '^#群前缀(开启|关闭)',
                    fnc: 'openPrefix',
                },
                {
                    reg: '^#设置前缀',
                    desc: '前缀设置',
                    fnc: 'setPrefix',
                }
            ]
        })
    }

    async openPrefix(e) {
        if (!e.isMaster) {
            return this.reply("权限不足！")
        }
        let text = e.msg.replace(/#|群前缀/g, "")
        if (text == '开启') {
            this.SetCfg('group', `${e.group_id}.onlyReplyAt`, 1)
        } else if (text == '关闭') {
            this.SetCfg('group', `${e.group_id}.onlyReplyAt`, 0)
        } else {
            console.log("无效的设置!")
        }
        this.reply(`群前缀已${text}!`)
    }

    async setPrefix(e) {
        if (!e.isMaster) {
            return this.reply("权限不足！")
        }
        let name = e.msg.replace("#设置前缀", "")
        if (!name.trim()) {
            return this.reply("群前缀不能为空！")
        }
        this.SetCfg('group', `${e.group_id}.botAlias`, name)
        this.reply(`群前缀已设置为${name}!`)
    }


    SetCfg(name, key, value) {
        let Cfg = new YamlReader(`${process.cwd()}/config/config/${name}.yaml`)
        Cfg.set(key, value)
    }


}





