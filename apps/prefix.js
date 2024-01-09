import Base from '../model/base/Base.js'
import YamlReader from '../utils/YamlReader.js'
export default class prefix extends Base {
    constructor() {
        super({
            name: 'prefix',
            priority: 50,
            rule: [
                {
                    reg: '^#群前缀(开启|关闭)$',
                    fnc: 'openPrefix',
                },
                {
                    reg: '^#设置前缀',
                    fnc: 'setPrefix',
                },
                {
                    reg: '^#尾缀(开启|关闭)$',
                    fnc: 'openendPrefix',
                },
                {
                    reg: '^#设置尾缀',
                    fnc: 'setendPrefix',
                },
                {
                    reg: '你(的|)主人是(谁|哪个)',
                    fnc: 'whoismaster'
                },
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
            return this.reply("无效的设置!")
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

    async whoismaster(e) {
        if (!e.atme && !e.atBot) return false
        let map = await e.group.getMemberMap()
        let other = new YamlReader(`${process.cwd()}/config/config/other.yaml`).jsonData
        let memberlist = [...map].map(item => item[0])
        let msg = ['我的主人是']
        if (Array.isArray(other.masterQQ)) {
            let isinGroup = false
            other.masterQQ.forEach(item => {
                if (memberlist.includes(item)) {
                    isinGroup = true
                    msg.push(this.segment.at(item))
                }
            })
            if (!isinGroup) {
                return this.reply(`我的主人不在这个群，主人qq号为:${other.masterQQ.join('、')}`)
            }
        } else {
            return this.reply("我是一枚野生的机器人呢！")
        }
        return this.reply(msg)

    }


    async openendPrefix(e) {
        if (!e.isMaster) {
            return true
        }
        let text = e.msg.replace(/#|尾缀/g, "")
        if (text == '开启') {
            await redis.set('qianyu:iswzopen', 1)
        } else if (text == '关闭') {
            await redis.set('qianyu:iswzopen', 0)
        } else {
            return true
        }
        this.reply(`尾缀已${text}!`)
    }

    async setendPrefix(e) {
        if (!e.isMaster) return true
        if (e.message.some(item => item.type === 'image')) return this.reply("尾缀不能设置图片！")
        let value = e.message.map(item => {
            if (item.type === 'text') {
                item.text = item.text.replace("#设置尾缀", "")
            }
            return item
        })
        if (e.message.length == 1 && e.message[0].type == 'text') {
            value = e.msg.replace("#设置尾缀", "").trim()
        }
        if (!Array.isArray(value) && !e.msg.replace("#设置尾缀", "").trim()) {
            return this.reply("尾缀不能为空！")
        }
        await redis.set('qianyu:wz', JSON.stringify(value))
        this.reply(Array.isArray(value) ? [{ type: 'text', text: '尾缀已设置为' }, ...value, '!'] : `尾缀已设置为${value}!`)
    }

}





