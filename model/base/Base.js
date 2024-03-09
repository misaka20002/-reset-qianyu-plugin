import Config from './Config.js'
import Data from './Data.js'
import File from '../../utils/Filemage.js'
import networks from '../../utils/networks.js'
import downfile from '../../utils/downfile.js'
import Path from './Path.js'
import common from '../../utils/common.js'
import timer from '../../utils/Timer.js'
import render from './render.js'
import { segment } from '../../component/icqq/index.js'
let stateArr = {}
export default class Base {
    constructor(data) {
        this.name = data.name
        this.Data = new Data(data.name)
        this.Config = Config
        this.File = new File(Path.qianyuPath)
        this.networks = networks
        this.downfile = downfile
        this.Path = Path
        this.common = new common()
        this.event = data.event || 'message'
        this.priority = data.priority || 5000
        this.timer = timer
        this.render = render
        this.segment = segment
        this.task = {
            /** 任务名 */
            name: data.task?.name || '',
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

    async makeGroupMsg(title, msg, isfk = false, user_id) {
        let nickname = Bot.nickname
        let uid = user_id ? user_id : Bot.uin
        if (this.e.isGroup) {
            let info = await Bot.getGroupMemberInfo(this.e.group_id, uid)
            nickname = info.card ?? info.nickname
        }
        let userInfo = {
            user_id: uid,
            nickname
        }
        let forwardMsg = []
        msg.forEach(item => {
            let obj = {
                ...userInfo,
                message: item.content,
            }
            if (item.time) {
                obj.time = item.time
            }
            forwardMsg.push(obj)
        });
        /** 制作转发内容 */
        if (this.e?.group?.makeForwardMsg) {
            forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
        } else if (this.e?.friend?.makeForwardMsg) {
            forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
        } else {
            return msg.join('\n')
        }

        if (title) {
            /** 处理描述 */
            if (typeof (forwardMsg.data) === 'object') {
                let detail = forwardMsg.data?.meta?.detail
                if (detail) {
                    detail.news = [{ text: title }]
                }
            } else {
                if (isfk) {
                    forwardMsg.data = forwardMsg.data
                        .replace('<?xml version="1.0" encoding="utf-8"?>', '<?xml version="1.0" encoding="utf-8" ?>')
                }
                forwardMsg.data = forwardMsg.data
                    .replace(/\n/g, '')
                    .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
                    .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)
            }
        }

        return forwardMsg
    }
}