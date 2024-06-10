import _ from 'lodash'
import Base from '../model/base/Base.js'
let msg = {}
export default class repace extends Base {
    constructor() {
        super({
            name: 'repace',
            priority: 2000,
            rule: [
                {
                    reg: '#(群聊复读|打断复读)(开启|关闭)$',
                    fnc: 'setfd',
                    log: false
                },
                {
                    reg: '',
                    fnc: 'fd',
                    log: false
                },
            ],
        })
        this.fdCfg = {
            repace: true,
            bkrepace: false
        }
    }

    async fd(e) {
        if (e.msg?.startsWith('#')) {
            // logger.info('消息以#开头，，不予理会')
            return false
        }
        if (!this.e.isGroup) return false
        if (this.Cfg[e.group_id]) {
            this.fdCfg = this.Cfg[e.group_id]
        }
        if (!this.fdCfg.repace) return false
        if (!msg[this.e.group_id]) {
            msg[this.e.group_id] = { msg: this.e.message, times: 1 }
            return false
        }
        if (await this.isSomeMessage(this.e.message, msg[this.e.group_id].msg)) {
            msg[this.e.group_id].times++
            if (msg[this.e.group_id].times == 3) {
                await Bot.pickGroup(e.group_id).sendMsg(msg[this.e.group_id].msg)
            } else if (msg[this.e.group_id].times == 5 && this.fdCfg.bkrepace) {
                if (!this.e.img) {
                    let random = _.random(0, 1)
                    if (random == 1) {
                        this.e.reply(this.Cfg.breakMsg[_.random(0, this.Cfg.breakMsg.length - 1)])
                    } else {
                        this.e.reply(this.randomString(this.e.msg))
                    }
                } else {
                    this.reply(this.segment.image(this.Path.qianyuPath + 'resources/img/打断复读.jpg'))
                }

            } else {
                return false
            }
        } else {
            msg[this.e.group_id].msg = this.e.message
            msg[this.e.group_id].times = 1
            return false
        }


    }

    async setfd(e) {
        if (!e.isMaster) return
        let text = e.msg.replace(/#群聊复读|#打断复读/g, "")
        let value;
        if (text == '开启') {
            value = true
        } else if (text == '关闭') {
            value = false
        } else {
            return true
        }
        if (!this.Cfg[this.e.group_id]) {
            let data = e.msg.includes("群聊复读") ? {
                repace: value,
                bkrepace: false
            } : {
                repace: true,
                bkrepace: value
            }
            this.Config.SetCfg('repace', `${e.group_id}`, data)
        } else {
            delete this.Config.Cfg['repace']
            if (e.msg.includes("群聊复读")) {
                this.Config.SetCfg('repace', `${e.group_id}.repace`, value)
            } else {
                this.Config.SetCfg('repace', `${e.group_id}.bkrepace`, value)
            }

        }
        this.reply(`${e.msg.replace(/开启|关闭/g, "")}已${text}!`)
    }

    async isSomeMessage(data, data2) {
        if (data.length !== data2.length) return false
        for (let d in data) {
            if (data[d].type == 'image' && data2[d].type == 'image') {
                if (data[d].file !== data2[d].file) return false
            } else {
                if (!_.isEqual(data[d], data2[d])) return false
            }
        }
        return true
    }

    randomString(msg) {
        if (!msg) return '阿巴阿巴'
        let newStrAll = [];
        msg.split('').forEach((item) => {
            var newIndex = _.random(0, newStrAll.length);
            newStrAll.splice(newIndex, 0, item);
        });
        return newStrAll.join('')
    }

}







