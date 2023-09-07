import moment from 'moment'
import Base from '../model/base/Base.js'
import lodash from 'lodash'
let msg = {}
let groupList = []
export default class groupimg extends Base {
    constructor() {
        super({
            name: 'groupimg',
            priority: 50,
            rule: [
                {
                    reg: '^#查看所有表情',
                    fnc: 'seeface'
                },
                {
                    reg: '^(哒|达)咩$',
                    fnc: 'deleteface'
                },
                {
                    reg: '',
                    fnc: 'uxmsg',
                    log: false
                }

            ],
            task: {
                name: 'sendimg',
                fnc: 'sendimg',
                cron: '0 */5 * * * *'
            },
        })
        let fileterList = ['learnTimes', 'isSendMsg']
        groupList = this.Cfg !== null ? Object.keys(this.Cfg).filter(item => !fileterList.includes(item)) : []
    }
    async seeface(e) {
        let imgData = this.Data.getDataJson(`groupface/${e.group_id}-face`) || []
        if (imgData.length == 0) {
            return this.reply("还没有在该群学习过表情包")
        }
        this.reply(this.makeGroupMsg('查看所有表情', imgData, true))
    }

    async uxmsg(e) {
        if (!e.isGroup) return false
        let random = lodash.random(0, 100)
        if (groupList.includes(`${e.group_id}`)) {
            msg[e.group_id] = msg[e.group_id] || {}
            msg[e.group_id] = { ...msg[e.group_id], ...e }
            msg[e.group_id].sum = msg[e.group_id].sum ? ++msg[e.group_id].sum : 1
        }
        if (random < this.Cfg.random && this.Cfg[e.group_id]?.isOpen) {
            let imgData = this.Data.getDataJson(`groupface/${e.group_id}-face`) || []
            if (imgData.length === 0) return false
            let img = imgData[lodash.random(0, imgData.length - 1)]
            let rs = await this.reply(img.content)
            let m = (await e.group.getChatHistory(rs.seq, 1))[0]
            msg[e.group_id] = { ...msg[e.group_id], ...m }
            msg[e.group_id].sum = ++msg[e.group_id].sum
            msg[e.group_id].sendimgsum = msg[e.group_id].sendimgsum ? ++msg[e.group_id].sendimgsum : 1
            return true
        }
        return false
    }

    async deleteface(e) {
        if (!e.source) {
            return false
        }
        if (e.source.user_id == e.self_id) {
            let m = (await e.group.getChatHistory(e.source.seq, 1))[0]
            let msg = m.message
            if (!msg) return false
            let imgData = this.Data.getDataJson(`groupface/${e.group_id}-face`) || []
            let isdelete = false
            imgData.forEach((item, index) => {
                if (item.content.file === msg[0].file) {
                    isdelete = true
                    imgData.splice(index, 1)
                }
            });
            if (!isdelete) return false
            let res = await e.group.recallMsg(m.message_id)
            if (!res) {
                this.reply("伦家不是管理员，不能撤回超过2分钟的消息呢~")
            }
            Bot.pickGroup(e.group_id).sendMsg("呜呜呜~我错了，以后不发了~呜")
            this.Data.setDataJson(imgData, `groupface/${e.group_id}-face`)
        }
    }

    async sendimg() {
        if (moment().hours() >= 0) {
            let rdtime = lodash.random(5, 30)
            for (let g of groupList) {
                if (this.Cfg[g].isOpen) {
                    let imgData = this.Data.getDataJson(`groupface/${g}-face`) || []
                    if (imgData.length === 0) return false
                    let img = imgData[lodash.random(0, imgData.length - 1)]
                    msg[g] = msg[g] ? msg[g] : {}
                    if (msg[g]?.user_id === Bot.uin) {
                        //暂未定
                    } else {
                        let time = msg[g]?.time || 0
                        let sum = msg[g].sum ? ++msg[g].sum : 1
                        if (moment().unix() >= time + (rdtime * 60)) {
                            //冷群时间
                            let rs = await Bot.pickGroup(g).sendMsg(img.content)
                            let m = (await Bot.pickGroup(g).getChatHistory(rs.seq, 1))[0]
                            msg[g] = { ...msg[g], ...m }
                            msg[g].sum = sum
                            msg[g].sendimgsum = msg[g].sendimgsum ? ++msg[g].sendimgsum : 1
                        }
                    }

                }
            }

        }
    }
}