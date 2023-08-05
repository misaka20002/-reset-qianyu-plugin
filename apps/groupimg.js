import moment from 'moment'
import Base from '../model/base/Base.js'
import lodash from 'lodash'
let msg = {
    time: 0
}
let groupList = []
export default class groupimg extends Base {
    constructor() {
        super({
            name: 'groupimg',
            priority: 50,
            rule: [
                {
                    reg: '#查看所有表情',
                    fnc: 'seeface'
                },
                {
                    reg: '^(哒|达)咩$',
                    fnc: 'deleteface'
                },
                {
                    reg: '',
                    fnc: 'uxmsg'
                }

            ],
            task: {
                name: 'sendimg',
                fnc: 'sendimg',
                cron: '0 */3 * * * *'
            },
        })
        groupList = this.Cfg !== null ? Object.keys(this.Cfg).filter(item => item !== 'learnTimes') : []
    }
    async seeface(e) {
        if (!e.isMaster) return false
        let imgData = this.Data.getDataJson(`groupface/${e.group_id}-face`) || []
        if (imgData.length == 0) {
            return this.reply("还没有在该群学习过表情包")
        }
        this.reply(this.makeGroupMsg('查看所有表情', imgData, true))
    }

    async uxmsg(e) {
        if (!e.isGroup) return false
        if (groupList.includes(e.group_id)) {
            msg[e.group_id] = {}
            msg[e.group_id] = e
        }
        return false
    }

    async deleteface(e) {
        if (!e.source) {
            return false
        }
        if (e.source.user_id == e.self_id) {
            let msg = (await e.group.getChatHistory(e.source.seq, 1))[0].message
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
            Bot.pickGroup(e.group_id).sendMsg("呜呜呜~我错了，以后不发了~呜")
            this.Data.setDataJson(imgData, `groupface/${e.group_id}-face`)
        }
    }

    async sendimg() {
        if (moment().hours() >= 8) {
            let random = lodash.random(5, 30)
            for (let g of groupList) {
                if (this.Cfg[g].isOpen) {
                    let time = msg[g]?.time || 0
                    if (moment().unix() >= time + (random * 60)) {
                        let imgData = this.Data.getDataJson(`groupface/${g}-face`) || []
                        let img = imgData[lodash.random(0, imgData.length - 1)]
                        msg[g] = {}
                        msg[g].time = moment().unix()
                        Bot.pickGroup(g).sendMsg(img.content)
                    }
                }
            }

        }
    }
}