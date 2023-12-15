import moment from 'moment'
import Base from '../model/base/Base.js'
import lodash from 'lodash'
import fetch from 'node-fetch'
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
                    fnc: 'seeface',
                    permission: 'master'
                },
                {
                    reg: '^#?(哒|达)咩$',
                    fnc: 'deleteface',
                    permission: 'master'
                }, {
                    reg: '^#(删除|清理)过期表情包',
                    fnc: 'filterimg',
                    permission: 'master'
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
        let page = this.e.msg.replace("#查看所有表情", "") || 1
        let bqsum = imgData.length
        if (imgData.length == 0) {
            return this.reply("还没有在该群学习过表情包")
        }
        if (imgData.length >= 50) {
            imgData = this.changeArrGroup(imgData, 50)
            if (isNaN(page)) {
                return this.reply("页码必须是数字！")
            }
            if (page < 1 || page > imgData.length) {
                return this.reply("页码错误！")
            }
            imgData[page - 1].push({ content: `共${imgData.length}页，第${page}页` })
        }
        this.reply(await this.makeGroupMsg(`查看所有表情第${page}页，总共${bqsum}张表情包`, imgData.length >= 50 ? imgData[page - 1] : imgData, true))
    }

    async filterimg(e) {
        let imgData = this.Data.getDataJson(`groupface/${e.group_id}-face`) || []
        this.reply("开始检测中，请稍等一段时间...")
        let deletetime = 0
        for (let i in imgData) {
            let rsp = await fetch(imgData[i].content.url)
            if (rsp.status != 200) {
                deletetime++
                imgData.splice(i, 1)
            }
        }
        this.reply(`共有${imgData.length}张表情包，删除过期表情包${deletetime}个！`)
        this.Data.setDataJson(imgData, `groupface/${e.group_id}-face`)
    }


    changeArrGroup(arr, newArrLength) {
        let changeIndex = 0;
        let secondArr = [];
        while (changeIndex < arr.length) {
            secondArr.push(arr.slice(changeIndex, changeIndex += newArrLength))
        }
        return secondArr;
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
                            //冷群时间了
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