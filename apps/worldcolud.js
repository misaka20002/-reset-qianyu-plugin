import moment from "moment";
import lodash from 'lodash'
import Base from '../model/base/Base.js'
let issqtj = false
export default class worldColud extends Base {
    constructor() {
        super({
            name: 'worldcolud',
            priority: 50,
            rule: [
                {
                    reg: '^(#|)(三日|一周|)水群统计$',
                    fnc: 'sqtj',
                },
                {
                    reg: '^(#|)(前日|今日|昨日)发言记录$',
                    fnc: 'usermsg',
                },
            ],
            task: {
                name: 'learnGroupImg',
                fnc: 'learnGroupImg',
                cron: '0 5 0 * * *'
            },
        })

    }

    init() {
        this.File.CreatDir('data/groupMsgRand')
        let groupList = Bot.gl
        for (let g of groupList) {
            this.File.CreatDir(`data/groupMsgRand/${g[0]}`)
        }
    }

    async usermsg(e) {
        let day = '今日'
        day = e.msg.replace(/#|发言记录/g, "") || '今日'
        this.reply(`正在查找${day}发言记录......`)
        let Cfg = { isMsgInfo: true }
        let time = {
            昨日: 1,
            前日: 2
        }
        let startTime = moment().hour(0).minute(0).second(0)
        let endTime = moment()
        if (day !== '今日') {
            startTime = moment().subtract(time[day], 'days').hour(0).minute(0).second(0)
            endTime = moment(startTime).add(1, 'days').hour(0).minute(0).second(0)
        }
        let groupMsglist = await this.getGroupHistoryMsg(startTime, endTime, Cfg)
        let user_id = e.user_id
        if (e.at) {
            user_id = e.at
        }
        groupMsglist[user_id].msglist.forEach((item, index) => {
            item.content.forEach((cont) => {
                if (cont.type == 'file') {
                    groupMsglist[user_id].msglist[index] = { content: { type: 'text', text: '[文件消息不支持查看！]' }, time: item.time }
                }
            })
        })
        this.reply(await this.makeGroupMsg(`${day}发言记录`, lodash.orderBy(groupMsglist[user_id].msglist, 'time', 'asc'), true, user_id))
    }

    async sqtj(e) {
        if (issqtj) {
            return this.reply("还在统计中，请勿重复发出指令！")
        }
        let day = '今日'
        day = e.msg.replace(/#|水群统计/g, "") || '今日'
        this.reply(`正在分析${day}的聊天记录，稍后生成榜单......`)
        issqtj = true
        let startTime = ''
        let endTime = ''
        let Cfg = { iscountBot: true, iscountAll: true, iscountByDay: day == '今日' ? false : true }
        let time = {
            三日: 2,
            一周: 6
        }
        let groupMsglist, jsonData;
        if (day !== '今日') {
            startTime = moment().subtract(time[day], 'days').hour(0).minute(0).second(0)
            endTime = moment()
            this.File.CreatDir(`data/groupMsgRand/${this.e.group_id}`)
            jsonData = this.Data.getDataJson(`groupMsgRand/${this.e.group_id}/${moment(startTime).format("YYYY-MM-DD")}`)
            if (jsonData) {
                groupMsglist = {
                    botcount: 0,
                    allcount: 0
                }
                groupMsglist[moment(startTime).format("YYYY-MM-DD")] = jsonData
                groupMsglist.allcount = jsonData.allcount
                groupMsglist.botcount = jsonData.botcount
                for (let i = 1; i < time[day]; i++) {
                    groupMsglist[moment().subtract(i, 'days').format("YYYY-MM-DD")] = this.Data.getDataJson(`groupMsgRand/${this.e.group_id}/${moment().subtract(i, 'days').format("YYYY-MM-DD")}`)
                    groupMsglist.allcount += groupMsglist[moment().subtract(i, 'days').format("YYYY-MM-DD")].allcount
                    groupMsglist.botcount += groupMsglist[moment().subtract(i, 'days').format("YYYY-MM-DD")].botcount
                }
                groupMsglist[moment().format("YYYY-MM-DD")] = await this.getGroupHistoryMsg('', '', { iscountBot: true, iscountAll: true })
                groupMsglist.allcount += groupMsglist[moment().format("YYYY-MM-DD")].allcount
                groupMsglist.botcount += groupMsglist[moment().format("YYYY-MM-DD")].botcount
            }
        }
        if (!groupMsglist) {
            groupMsglist = await this.getGroupHistoryMsg(startTime, endTime, Cfg)
        }
        let data = {}
        if (day !== '今日') {
            for (let d in groupMsglist) {
                if (d == 'allcount' || d == 'botcount') continue
                if (!this.File.ExistsFile(`data/groupMsgRand/${this.e.group_id}/${d}.json`)) {
                    this.Data.setDataJson({
                        botcount: groupMsglist[d].botcount, allcount: groupMsglist[d].allcount, ...groupMsglist[d]
                    }, `groupMsgRand/${this.e.group_id}/${d}`)
                }
                for (let g in groupMsglist[d]) {
                    if (g == 'allcount' || g == 'botcount') continue
                    if (!data[g]) {
                        data[g] = {
                            times: 0,
                            user_id: g,
                            facestime: 0,
                            uname: groupMsglist[d][g].uname
                        }
                    }
                    data[g] = {
                        ...data[g],
                        times: data[g].times + groupMsglist[d][g].times,
                        facestime: data[g].facestime + groupMsglist[d][g].facestime,
                    }
                }
            }
            groupMsglist = { allcount: groupMsglist.allcount, botcount: groupMsglist.botcount, ...data }
        }
        let groupmemberlist = await e.group.getMemberMap()
        let memberlist = []
        for (let m of groupmemberlist) {
            memberlist.push(m[1])
        }
        memberlist = lodash.orderBy(memberlist, 'last_sent_time', 'asc')
        moment.locale('zh-cn')
        memberlist[0].lastmsgtime = moment.unix(memberlist[0].last_sent_time).fromNow().replace(/\s*/g, "")
        let CharArray = [];
        for (const key in groupMsglist) {
            if (key == 'allcount' || key == 'botcount') continue
            CharArray.push(groupMsglist[key]);
        }
        CharArray.sort((a, b) => {
            return b.times - a.times
        })
        let bclist = lodash.orderBy(CharArray, 'facestime', 'desc')
        CharArray = CharArray.slice(0, CharArray.length > 10 ? 10 : CharArray.length);
        for (let i in CharArray) {
            CharArray[i].Percentage = (CharArray[i].times / groupMsglist.allcount * 100).toFixed(2)
        }
        issqtj = false
        return this.reply(await this.render(`list`, { charlist: CharArray, dsw: CharArray[0], bqd: bclist[0], shwz: memberlist[0], type: 'png', botcount: groupMsglist.botcount, allcount: groupMsglist.allcount, day: day }))
    }


    /**
    * group 群id
    * startTime 开始时间
    * endTime 结束时间
    * Cfg.isMsgInfo 是否获取具体消息
    * Cfg.iscountBot 是否获取bot消息统计
    * Cfg.iscountAll 是否获取总消息统计
    * Cfg.iscountByDay 是否根据天数分割
    */
    async getGroupHistoryMsg(startTime, endTime, Cfg = { isMsgInfo: false, iscountBot: false, iscountAll: false }, group_id = this.e.group_id) {
        let isover;
        let CharList = {}
        let data = {}
        let CharHistory = await Bot.pickGroup(group_id).getChatHistory(0, 1);
        let seq = CharHistory[0]?.seq;
        if (!seq) return false
        let centerTime = endTime ? moment(endTime).unix() : moment().hour(0).minute(0).second(0).unix()
        Cfg.iscountBot ? data.botcount = 0 : ''
        Cfg.iscountAll ? data.allcount = 0 : ''

        startTime = startTime ? moment(startTime).unix() : moment().hour(0).minute(0).second(0).unix()
        endTime = endTime ? moment(endTime).unix() : moment().unix()
        if (moment(endTime * 1000) != moment().hour(0).minute(0).second(0)) {
            centerTime = moment().hour(0).minute(0).second(0).unix()
        }
        for (let i = seq; i > 0; i = i - 20) {
            let CharTemp = await Bot.pickGroup(group_id).getChatHistory(i, 20);
            CharTemp = lodash.orderBy(CharTemp, 'time', 'desc')
            if (i == seq && CharTemp.length == 0) {
                return false
            }
            if (CharTemp.length == 0) {
                if (Cfg.iscountByDay) {
                    data[moment().format("YYYY-MM-DD")] = { ...data[moment().format("YYYY-MM-DD")], ...CharList }
                } else {
                    data = { ...data, ...CharList }
                }
                break;
            }
            for (const key in CharTemp) {
                let t = CharTemp[key].time * 1000
                if (Cfg.iscountByDay) {
                    if (!data[moment(t).format("YYYY-MM-DD")] && CharTemp[key].time >= startTime) {
                        data[moment(t).format("YYYY-MM-DD")] = {
                            botcount: 0,
                            allcount: 0
                        }
                    }
                    if (CharTemp[key].time < centerTime) {
                        centerTime = moment(t).hour(0).minute(0).second(0).unix()
                        data[moment(t).add(1, 'd').format("YYYY-MM-DD")] = { ...data[moment(t).add(1, 'd').format("YYYY-MM-DD")], ...CharList }
                        CharList = {}
                    }
                }
                if (CharTemp[key].time < startTime) {
                    isover = true
                    break;
                }
                if (CharTemp[key].time > endTime) {
                    continue;
                }
                if (CharTemp[key].user_id == Bot.uin) {
                    Cfg.iscountBot ? data.botcount++ : ''
                    Cfg.iscountByDay ? data[moment(t).format("YYYY-MM-DD")].botcount++ : ""
                    continue;
                }

                if (CharList[CharTemp[key].user_id]) {
                    CharList[CharTemp[key].user_id].times += 1;
                    CharList[CharTemp[key].user_id].uname = CharTemp[key].sender.card ? CharTemp[key].sender.card : CharTemp[key].sender.nickname;
                    if (CharTemp[key].raw_message == "[动画表情]") {
                        CharList[CharTemp[key].user_id].facestime += 1
                    }
                } else {
                    CharList[CharTemp[key].user_id] = {
                        times: 1,
                        user_id: CharTemp[key].user_id,
                        facestime: 0,
                        uname: CharTemp[key].sender.card ? CharTemp[key].sender.card : CharTemp[key].sender.nickname
                    };
                }

                if (!CharList[CharTemp[key].user_id].msglist) {
                    CharList[CharTemp[key].user_id].msglist = []
                }
                if (Cfg.isMsgInfo) {
                    CharList[CharTemp[key].user_id].msglist.push({ content: CharTemp[key]?.message, time: CharTemp[key].time })
                }
                Cfg.iscountAll ? data.allcount++ : ""
                Cfg.iscountByDay ? data[moment(t).format("YYYY-MM-DD")].allcount++ : ""
            }
            if (isover) {
                data = Cfg.iscountByDay ? { ...data } : { ...CharList, ...data }
                break;
            }
        }
        return { ...data }
    }

    async learnGroupImg() {
        let groupList = Bot.gl
        let Cfg = { iscountBot: true, iscountAll: true, isMsgInfo: true }
        let msgList = {}
        let face = {}
        let faceList = []
        this.File.CreatDir('data/groupface')
        let newData = {}
        for (let g of groupList) {
            let data = await this.getGroupHistoryMsg(moment().subtract(1, 'd').hour(0).minute(0).second(0), moment().hour(0).minute(0).second(0), Cfg, g[0])
            if (!face[g[0]]) {
                face[g[0]] = {}
            }
            if (!data) continue;
            newData = { allcount: data.allcount, botcount: data.botcount }
            for (let d in data) {
                if (d == 'allcount' || d == 'botcount') continue
                newData[d] = { ...data[d], msglist: [] }
                if (!msgList[g[0]]) {
                    msgList[g[0]] = []
                }
                for (let m of data[d].msglist) {
                    for (let c of m.content) {
                        if (c.type == 'image' && c.asface) {
                            msgList[g[0]].push(c)
                        }
                    }
                }
            }
            let date = moment().subtract(1, 'd').format("YYYY-MM-DD")
            this.Data.setDataJson(newData, `groupMsgRand/${g[0]}/${date}`)
            if (!msgList[g[0]]) continue;
            for (let m of msgList[g[0]]) {
                if (!face[g[0]][m.file]) {
                    face[g[0]][m.file] = {
                        content: m,
                        times: 1
                    }
                }
                face[g[0]][m.file].times++
            }
            faceList = Object.values(face[g[0]]).filter(item => item.times >= this.Config.GetCfg('groupimg').learnTimes)
            let oldList = this.Data.getDataJson(`groupface/${g[0]}-face`) || []
            faceList = faceList.filter(item => !oldList.some(it => it.content.file === item.content.file))
            let facelist = [...oldList, ...faceList]
            this.Data.setDataJson(facelist, `groupface/${g[0]}-face`)
            if (faceList.length > 0 && this.Config.GetCfg('groupimg').isSendMsg) {
                Bot.pickGroup(g[0]).sendMsg(await this.makeGroupMsg2('昨日学习表情包', faceList, true, g[0]))
            }

        }
    }

    async makeGroupMsg2(title, msg, isfk = false, group_id, user_id) {
        let nickname = Bot.nickname
        let uid = user_id ? user_id : Bot.uin
        let userInfo = {
            user_id: uid,
            nickname
        }
        let forwardMsg = []
        msg.forEach(item => {
            forwardMsg.push({
                ...userInfo,
                message: item.content,
                time: item.time || ''
            })
        });
        /** 制作转发内容 */
        if (Bot.pickGroup(group_id).makeForwardMsg) {
            forwardMsg = await Bot.pickGroup(group_id).makeForwardMsg(forwardMsg)
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