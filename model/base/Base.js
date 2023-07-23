import Config from './Config.js'
import Data from './Data.js'
import File from '../../utils/Filemage.js'
import networks from '../../utils/networks.js'
import downfile from '../../utils/downfile.js'
import Path from './Path.js'
import common from '../../utils/common.js'
import timer from '../../utils/Timer.js'
let stateArr = {}
export default class Base {
    constructor(data) {
        this.name = data.name
        this.Data = new Data(data.name)
        this.Config = Config
        this.File = new File()
        this.networks = networks
        this.downfile = downfile
        this.Path = Path
        this.common = new common()
        this.event = data.event || 'message'
        this.priority = data.priority || 5000
        this.timer = timer
        this.task = {
            /** 任务名 */
            name: '',
            /** 任务方法名 */
            fnc: data.task?.fnc || '',
            /** 任务cron表达式 */
            cron: data.task?.cron || ''
        }

        /** 命令规则 */
        this.rule = data.rule || []
    }


    get Cfg() {
        return Config.GetCfg(this.name)
    }

    set Cfg(data) {
        Config.SetCfg(this.name, data.key, data.value)
    }

    reply(msg = '', quote = false, data = {}) {
        if (!this.e.reply || !msg) return false
        return this.e.reply(msg, quote, data)
    }

    conKey(isGroup = false) {
        if (isGroup) {
            return `${this.name}.${this.e.group_id}`
        } else {
            return `${this.name}.${this.userId || this.e.user_id}`
        }
    }

    /**
     * @param type 执行方法
     * @param isGroup 是否群聊
     * @param time 操作时间，默认120秒
     */
    setContext(type, isGroup = false, time = 120) {
        let key = this.conKey(isGroup)
        if (!stateArr[key]) stateArr[key] = {}
        stateArr[key][type] = this.e
        if (time) {
            /** 操作时间 */
            setTimeout(() => {
                if (stateArr[key][type]) {
                    delete stateArr[key][type]
                    this.e.reply('操作超时已取消', true)
                }
            }, time * 1000)
        }
    }

    getContext() {
        let key = this.conKey()
        return stateArr[key]
    }

    getContextGroup() {
        let key = this.conKey(true)
        return stateArr[key]
    }

    /**
     * @param type 执行方法
     * @param isGroup 是否群聊
     */
    finish(type, isGroup = false) {
        if (stateArr[this.conKey(isGroup)] && stateArr[this.conKey(isGroup)][type]) {
            delete stateArr[this.conKey(isGroup)][type]
        }
    }

    async makeGroupMsg(title, msg, isfk = false) {
        let nickname = Bot.nickname
        if (this.e.isGroup) {
            let info = await Bot.getGroupMemberInfo(this.e.group_id, Bot.uin)
            nickname = info.card ?? info.nickname
        }
        let userInfo = {
            user_id: Bot.uin,
            nickname
        }
        let forwardMsg = []
        msg.forEach(item => {
            forwardMsg.push({
                ...userInfo,
                message: item.content,
                time: item.time
            })
        });
        /** 制作转发内容 */
        if (this.e.isGroup) {
            forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
        } else {
            forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
        }

        /** 处理描述 */
        forwardMsg.data = forwardMsg.data
            .replace(/\n/g, '')
            .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
            .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)

        if (isfk) {
            forwardMsg.data = forwardMsg.data
                .replace('<?xml version="1.0" encoding="utf-8"?>', '<?xml version="1.0" encoding="utf-8" ?>')
        }
        return forwardMsg
    }
}