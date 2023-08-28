import moment from "moment"
import lodash from 'lodash'
import Base from '../model/base/Base.js'
let monightlist = {}
moment
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
                {
                    reg: '^睡眠信息$',
                    fnc: 'nightinfo',
                },
            ],
            task: {
                name: '早晚安',
                fnc: "clearTime",
                cron: '10 0 0 * * ?'
            }
        })
    }

    init() {
        this.File.CreatDir('data/greeting')
    }

    async nightinfo(e) {
        let userdata = this.Data.getDataJson(`greeting/${e.user_id}`) || {}
        let info = await Bot.getGroupMemberInfo(this.e.group_id, e.user_id)
        let imglist = this.File.GetfileList('resources/html/time/bg')
        let img = imglist[lodash.random(0, imglist.length - 1)]
        if (info.sex == "male") {
            info.sex = "男"
        } else if (info.sex == 'female') {
            info.sex = "女"
        } else if (info.sex == 'unknown') {
            info.sex = '魅魔小萝莉'
        }
        let timelist = Object.values(userdata) || []
        let mlist = lodash.sortBy(timelist, function (item) {
            return -Date.parse(item.mtime)
        });
        let nlist = lodash.sortBy(timelist, function (item) {
            return -Date.parse(item.ntime);
        });
        userdata.mtime = mlist[0]?.mtime ? moment(mlist[0].mtime).format("YYYY-MM-DD HH:mm") : "未获取到早安信息"
        userdata.ntime = nlist[0]?.ntime ? moment(nlist[0].ntime).format("YYYY-MM-DD HH:mm") : "未获取到晚安信息"

        let ntimelist = this.getdiffHours(userdata)

        let newnlist = ntimelist.filter(item => item !== 0)
        let average = newnlist.reduce((acc, val) => acc + val, 0) / newnlist.length || 0
        this.reply(await this.render('time', { info: info, userdata: userdata, daylist: JSON.stringify(daylist), ntimelist: JSON.stringify(ntimelist), average: average == 0 ? 0 : average.toFixed(1), img: img }))
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
        if (e.msg == '早安' && !monightlist[e.group_id].mlist.includes(e.user_id)) {
            let userdata = this.Data.getDataJson(`greeting/${e.user_id}`) || {}
            userdata[`${moment().format("YYYY-MM-DD")}`] = {
                ...userdata[`${moment().format("YYYY-MM-DD")}`],
                mtime: moment()
            }
            this.Data.setDataJson(userdata, `greeting/${e.user_id}`)
            let daydata = userdata[`${moment().format("YYYY-MM-DD")}`]
            monightlist[e.group_id].mnum += 1
            monightlist[e.group_id].mlist.push(e.user_id)
            if (daydata.ntime && (moment(daydata.ntime).date() === moment().subtract(1, 'd').date() || moment(daydata.ntime).date() === moment().date())) {
                msg = `早安成功！你的睡眠时长为${this.update(daydata.ntime)},`
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
        if (e.msg == '晚安' && !monightlist[e.group_id].nlist.includes(e.user_id)) {
            let userdata = this.Data.getDataJson(`greeting/${e.user_id}`) || {}
            userdata[`${moment().format("YYYY-MM-DD")}`] = {
                ...userdata[`${moment().format("YYYY-MM-DD")}`],
                ntime: moment()
            }
            this.Data.setDataJson(userdata, `greeting/${e.user_id}`)
            let daydata = userdata[`${moment().format("YYYY-MM-DD")}`]
            monightlist[e.group_id].nnum += 1
            monightlist[e.group_id].nlist.push(e.user_id)
            if (daydata.mtime && (moment(daydata.mtime).date() === moment().date() || moment(daydata.mtime).date() === moment().add(1, 'd').date())) {
                msg = `晚安成功！你的清醒时长为${this.update(daydata.mtime)},`
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

    // ismorning() {
    //     let hours = moment().hours()
    //     return hours >= 6 && hours <= 12
    // }

    // isevening() {
    //     let hours = moment().hours()
    //     return hours >= 21 || hours <= 3
    // }

    clearTime() {
        monightlist = {}
    }

    getdiffHours(data) {
        let day = moment().date()
        let daylist = [`${day}日`]
        let ntimelist = []
        for (let i = 0; i < 7; i++) {
            let t = userdata[moment().date(day - i).subtract(1, 'd').format("YYYY-MM-DD")]
            daylist.unshift(`${moment().date(day - i).subtract(1, 'd').date()}日`)
            ntimelist.unshift(this.getdiffHours(t) || 0)
        }
        if (!data) return false
        let diff = moment(data.ntime).diff(data.mtime)
        let h = moment.duration(diff).hours()
        console.log(moment.duration(diff).minutes());
        h += moment.duration(diff).minutes() / 60
        return Math.abs(h.toFixed(1))
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

