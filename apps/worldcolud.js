import moment from "moment";
import lodash from 'lodash'
import Base from '../model/base/Base.js'

export default class worldColud extends Base {
    constructor() {
        super({
            name: 'worldcolud',
            priority: 50,
            rule: [
                {
                    reg: '^(#|)水群统计',
                    fnc: 'sqtj',
                },
                {
                    reg: '^(#|)今日发言记录',
                    fnc: 'daySay',
                }
            ]
        })
    }

    async daySay(e) {
        this.reply('正在查找今日发言记录！')
        let groupMsglist = await this.getGroupHistoryMsg()
        let user_id = e.user_id
        if (e.at) {
            user_id = e.at
        }
        console.log(user_id);
        groupMsglist[user_id].msglist.forEach((item, index) => {
            item.content.forEach((cont) => {
                if (cont.type == 'file') {
                    groupMsglist[user_id].msglist[index] = { content: { type: 'text', text: '[文件消息不支持查看！]' }, time: item.time }
                }
            })
        })
        this.reply(await this.makeGroupMsg('今日发言记录', lodash.orderBy(groupMsglist[user_id].msglist, 'time', 'asc'), true, user_id))
    }

    async sqtj(e) {
        this.reply('正在分析今天的聊天记录，稍后生成榜单！')
        let groupMsglist = await this.getGroupHistoryMsg()
        let groupmemberlist = await e.group.getMemberMap()
        let memberlist = []
        for (let m of groupmemberlist) {
            memberlist.push(m[1])
        }
        memberlist = lodash.orderBy(memberlist, 'last_sent_time', 'asc')
        memberlist[0].lastmsgtime = moment.unix(memberlist[0].last_sent_time).fromNow().replace(/\s*/g, "")
        let CharArray = [];
        for (const key in groupMsglist) {
            if (key == 'allcount') continue
            CharArray.push(groupMsglist[key]);
        }
        CharArray.sort((a, b) => {
            return b.times - a.times
        })
        let bclist = lodash.orderBy(CharArray, 'facestime', 'desc')
        let l = Math.ceil(CharArray.length / 10);
        CharArray = CharArray.slice(0, CharArray.length > 10 ? 10 : CharArray.length);
        for (let i in CharArray) {
            CharArray[i].Percentage = (CharArray[i].times / groupMsglist.allcount * 100).toFixed(2)
        }
        return this.reply(await this.render(`list`, { charlist: CharArray, dsw: CharArray[0], bqd: bclist[0], shwz: memberlist[0], type: 'png' }))
    }



    async getGroupHistoryMsg(overTime) {
        //获取群历史消息，用户对象，存放每条用户消息
        let isover;
        let CharList = {}
        let CharHistory = await this.e.group.getChatHistory(0, 1);
        let seq = CharHistory[0].seq;
        let allcount = 0;
        overTime = overTime ? overTime : moment().hour(0).minute(0).second(0).unix()
        for (let i = seq; i > 0; i = i - 20) {
            let CharTemp = await this.e.group.getChatHistory(i, 20);
            CharTemp = lodash.orderBy(CharTemp, 'time', 'desc')
            if (i == seq && CharTemp.length == 0) {
                return false
            }
            if (CharTemp.length == 0) {
                break;
            }
            for (const key in CharTemp) {
                if (CharTemp[key].user_id == this.e.self_id) {
                    continue;
                }
                if (CharTemp[key].time < overTime) {
                    isover = true
                    break;
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
                CharList[CharTemp[key].user_id].msglist.push({ content: CharTemp[key]?.message, time: CharTemp[key].time })
                allcount++
            }
            if (isover) {
                break;
            }
        }
        return { ...CharList, allcount: allcount }
    }
}



