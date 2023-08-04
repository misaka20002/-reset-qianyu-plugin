import moment from "moment"
import lodash from 'lodash'
import Base from '../model/base/Base.js'
let monightlist = {}
export default class greeting extends Base {
    constructor() {
        super({
            name: 'greeting',
            priority: 50,
            rule: [
                {
                    reg: '^早$|^早安$|^早上好$',
                    fnc: 'morning',
                },
                {
                    reg: '^晚$|^晚安$|^晚上好$',
                    fnc: 'night',
                },
            ],
            task: {
                name: '早晚安',
                fnc: "clearTime",
                cron: '10 0 0 * * ?'
            }
        })
    }

    async morning(e) {
        let monringMsg = this.Cfg.monringMsg
        if (!monightlist[e.group_id]) {
            monightlist[e.group_id] = {
                mlist: [],//早安的人
                mnum: 0,//早安人数
                nlist: [],//晚安的人
                nnum: 0//晚安人数
            }
        }
        let hours = moment().hours()
        let msg = ``;
        if (e.msg == '早安' && this.ismorning() && !monightlist[e.group_id].mlist.includes(e.user_id)) {
            let userdata = JSON.parse(await redis.get(`qianyu:greeting:${e.user_id}`)) || {}
            redis.set(`qianyu:greeting:${e.user_id}`, JSON.stringify({ ...userdata, mtime: moment().format() }))
            monightlist[e.group_id].mnum += 1
            monightlist[e.group_id].mlist.push(e.user_id)
            console.log(userdata);
            if (userdata.ntime) {
                msg = `早安成功！你的睡眠时长为${this.update(userdata.ntime)},`
            }
            return this.reply(msg + `你是本群今天第${monightlist[e.group_id].mnum}个起床的！`, true)
        }
        if (hours >= 6 && hours < 10) {
            this.reply(monringMsg.morn[lodash.random(0, monringMsg.morn.length - 1)], true)
        }
        else if (hours <= 14 && hours >= 10) {
            this.reply(monringMsg.noon[lodash.random(0, monringMsg.noon.length - 1)], true)
        } else if (hours <= 18 && hours >= 15) {
            this.reply(monringMsg.afternoon[lodash.random(0, monringMsg.afternoon.length - 1)], true)
        } else if (hours > 18 && hours < 21) {
            this.reply(monringMsg.night[lodash.random(0, monringMsg.night.length - 1)], true)
        }
        else if (hours >= 21 || hours < 6) {
            this.reply(monringMsg.over[lodash.random(0, monringMsg.night.length - 1)], true)
        }

    }
    async night(e) {
        let eveningMsg = this.Cfg.eveningMsg
        if (!monightlist[e.group_id]) {
            monightlist[e.group_id] = {
                mlist: [],//早安的人
                mnum: 0,//早安人数
                nlist: [],//晚安的人
                nnum: 0//晚安人数
            }
        }
        let hours = moment().hours()
        let msg = ``;
        if (e.msg == '晚安' && this.isevening() && !monightlist[e.group_id].nlist.includes(e.user_id)) {
            let userdata = JSON.parse(await redis.get(`qianyu:greeting:${e.user_id}`)) || {}
            console.log(userdata);
            redis.set(`qianyu:greeting:${e.user_id}`, JSON.stringify({ ...userdata, ntime: moment().format() }))
            monightlist[e.group_id].nnum += 1
            monightlist[e.group_id].nlist.push(e.user_id)
            if (userdata.mtime) {
                msg = `晚安成功！你的清醒时长为${this.update(userdata.mtime)},`
            }

            return this.reply(msg + `你是本群今天第${monightlist[e.group_id].nnum}个睡觉的！`, true)
        }
        if (hours >= 6 && hours < 10) {
            this.reply(eveningMsg.morn[lodash.random(0, eveningMsg.morn.length - 1)], true)
        }
        else if (hours <= 14 && hours >= 10) {
            this.reply(eveningMsg.noon[lodash.random(0, eveningMsg.noon.length - 1)], true)
        } else if (hours <= 18 && hours >= 15) {
            this.reply(eveningMsg.afternoon[lodash.random(0, eveningMsg.afternoon.length - 1)], true)
        }
        else if (hours > 18 && hours < 21) {
            this.reply(eveningMsg.night[lodash.random(0, eveningMsg.night.length - 1)], true)
        }
        else if (hours >= 21 || hours < 6) {
            this.reply(eveningMsg.over[lodash.random(0, eveningMsg.night.length - 1)], true)
        }
    }

    ismorning() {
        let hours = moment().hours()
        return hours >= 6 && hours <= 12
    }

    isevening() {
        let hours = moment().hours()
        return hours >= 21 || hours <= 3
    }

    clearTime() {
        monightlist = {}
    }

    update(time) {
        let diff = moment().diff(time)
        // let mt = moment.duration(diff).months()
        // let d = moment.duration(diff).days()
        let h = moment.duration(diff).hours()
        let m = moment.duration(diff).minutes()
        let s = moment.duration(diff).seconds()
        return `${h}时${m}分${s}秒`
    }

}




