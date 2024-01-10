import moment from 'moment'
import cfg from '../../../lib/config/config.js'
import Base from '../model/base/Base.js'

export default class wz extends Base {
    constructor() {
        super({
            name: 'wz',
            priority: 1,
            rule: [
                {
                    reg: '^#清除伪装缓存$',
                    fnc: 'cleanwz',
                },
                {
                    reg: '^#伪装',
                    fnc: 'weiz',
                },
                {
                    reg: '^(#|)(结束|停止)伪装$',
                    fnc: 'stopwz',
                },
                {
                    reg: '^#设置伪装',
                    fnc: 'wzSet',
                },
                {
                    reg: '',
                    fnc: 'wz',
                    log: false
                }
            ],
            task: {
                name: 'clswz',
                fnc: 'clswz',
                cron: '0 0 0 * * *'
            },
        })
    }

    async init() {
        let iswz = await redis.get('qianyu:wz:iswz')
        let myuserinfo = JSON.parse(await redis.get('qianyu:wz:myinfo'))
        let InitiatorInfo = JSON.parse(await redis.get('qianyu:wz:InitiatorInfo'))
        if (iswz) {
            if (myuserinfo) {
                await this.bot.setAvatar(`${this.Path.qianyuPath}resources/img/${myuserinfo.user_id}.jpg`)
                await this.bot.setNickname(myuserinfo.nickname)
                this.bot.pickGroup(InitiatorInfo.group_id).setCard(myuserinfo.user_id, myuserinfo.nickname)
            }
            await redis.del('qianyu:wz:iswz')
            await redis.del('qianyu:wz:atuserinfo')
            await redis.del('qianyu:wz:InitiatorInfo')
        }
    }

    async wzSet(e) {
        if (!e.isMaster) return true
        let msg = e.msg.replace("#设置伪装", "")
        let set = {
            cd: {
                key: 'wzcd'
            },
            时长: {
                key: 'wztime'
            },
            次数上限: {
                key: 'max',
                range: 20
            },
            群友次数: {
                key: 'gcishu',
                range: 20
            }
        }
        let setlist = Object.keys(set)
        let s = setlist.find(item => msg.includes(item))
        let value = msg.replace(s, "")
        if (!value) {
            return this.reply("值不能为空！")
        }
        if (!s) {
            return this.reply("不存在设置项！")
        }
        if (isNaN(value)) {
            return this.reply('设置的值必须是数字！')
        }
        if (set[s].range && value >= set[s].range) {
            return this.reply(`数字范围不合理，最大值为${s.range}`)
        }
        this.Config.SetCfg('wz', set[s].key, value)
        return this.reply(`${s}已设置为${value}`)

    }

    async cleanwz(e) {
        if (!e.isMaster) return true
        await redis.del('qianyu:wz:iswz')
        await redis.del('qianyu:wz:atuserinfo')
        await redis.del('qianyu:wz:InitiatorInfo')
        await redis.del('qianyu:wz:myinfo')
        this.reply("伪装缓存清除成功！")
    }

    async weiz(e) {
        let cishu = this.Cfg.cishu
        if (!e.isGroup) {
            return false
        }
        let iswz = await redis.get('qianyu:wz:iswz')
        let myuserinfo = JSON.parse(await redis.get('qianyu:wz:myinfo'))
        if (iswz) {
            return this.reply("正在伪装中，请等待当前伪装任务结束！")
        }

        if (!e.at) {
            return this.reply("没有@指定目标伪装失败！")
        }
        if (e.at == e.self_id) {
            return this.reply("不能模仿我自己哦！")
        }
        if (!cfg.masterQQ.includes(e.user_id)) {
            if (cishu.sum >= this.Cfg.max) {
                return this.reply(`今日伪装次数不足，每天限定伪装${this.Cfg.max}次！主人不计入次数，但也不能乱玩哦！`)
            }
            if (cishu.sum >= 5) {
                this.reply("伪装次数过多可能导致伦家封号，要多注意哦！")
            }
            if (cishu.userlist?.[e.user_id] && cishu.userlist[e.user_id].sum >= this.Cfg.gcishu) {
                return this.reply("你今天已经玩过伪装了，明天再来吧！")
            }
            else if (cishu.iscd) {
                return this.reply("伪装还在cd中！")
            } else {
                let newuserlist = {
                    ...cishu.userlist
                }
                if (!newuserlist[e.user_id]) {
                    newuserlist[e.user_id] = {}
                }
                newuserlist[e.user_id] = {
                    sum: newuserlist[e.user_id]?.sum + 1 || 1
                }
                cishu = { ...cishu, sum: cishu.sum + 1, userlist: newuserlist }
                delete this.Config.Cfg['repace']
                this.Config.SetCfg('wz', `cishu`, cishu)
            }
        }
        let atuserinfo = await this.bot.pickMember(e.group_id, e.at).getSimpleInfo()
        atuserinfo.avatar = await this.bot.pickMember(e.group_id, e.at).getAvatarUrl()
        atuserinfo.group_name = await this.bot.pickMember(e.group_id, e.at).card
        atuserinfo.group_id = e.group_id
        if (!myuserinfo) {
            myuserinfo = await this.bot.pickMember(e.group_id, e.self_id).getSimpleInfo()
            //头像
            myuserinfo.avatar = await this.bot.pickMember(e.group_id, e.self_id).getAvatarUrl()

            await redis.set('qianyu:wz:myinfo', JSON.stringify(myuserinfo))
            let result = await this.downfile.downImg({ url: myuserinfo.avatar }, `${e.self_id}.jpg`)
            if (!result) return this.reply("头像下载失败！")
        }
        await redis.set('qianyu:wz:atuserinfo', JSON.stringify(atuserinfo))
        await redis.set('qianyu:wz:InitiatorInfo', JSON.stringify({
            user_id: e.user_id,
            group_id: e.group_id
        }))
        await redis.set('qianyu:wz:iswz', '1')
        await this.bot.setAvatar(atuserinfo.avatar)
        await this.bot.setNickname(atuserinfo.nickname)
        this.bot.pickGroup(e.group_id).setCard(e.self_id, atuserinfo.group_name)
        this.reply(`伪装任务开始！我已经伪装成指定目标，接下来${this.Cfg.wztime}分钟，我会模仿伪装目标说话！！`)
        await this.wztask(e)
    }

    async wz(e) {
        if (e.user_id == e.self_id) return false
        // 判断是否主人消息
        // if (cfg.masterQQ.includes(e.user_id)) return
        if (!e.isGroup) return false
        let iswz = await redis.get('qianyu:wz:iswz')
        if (!iswz) return false
        let atuserinfo = JSON.parse(await redis.get('qianyu:wz:atuserinfo'))
        if (e.group_id != atuserinfo.group_id) return false
        if (e.user_id != atuserinfo.user_id) return false
        let msg = e.message
        let sendmsg = []
        for (let m of msg) {
            switch (m.type) {
                case 'image':
                    sendmsg.push(this.segment.image(m.url))
                    break;
                case 'text':
                    if (e.source != undefined) {
                        this.bot.sendGroupMsg(e.group_id, [segment.at(e.source.user_id), " ", m.text], e.source)
                    } else {
                        sendmsg.push(m.text)
                    }
                    break;
                case 'face':
                    sendmsg.push(this.segment.face(m.id))
                    break
                case 'bface':
                    sendmsg.push(this.segment.bface(m.file))
                    break
                case 'at':
                    sendmsg.push(this.segment.at(m.qq))
                    break;
            }
        }
        if (!e.source) {
            this.bot.pickGroup(e.group_id).sendMsg(sendmsg)
        }
        return true
    }
    async stopwz(e) {
        let iswz = await redis.get('qianyu:wz:iswz')
        let myuserinfo = JSON.parse(await redis.get('qianyu:wz:myinfo'))
        if (!iswz) {
            return this.reply("还没有进行伪装任务！")
        }
        if (!e.isGroup) {
            return this.reply("非法的指令！")
        }
        let InitiatorInfo = JSON.parse(await redis.get('qianyu:wz:InitiatorInfo'))
        if (e.user_id != InitiatorInfo.user_id && !cfg.masterQQ.includes(e.user_id)) {
            return this.reply("只有发起人才能结束伪装！")
        }
        if (InitiatorInfo.group_id != e.group_id) {
            return this.reply("只有发起的群才能结束伪装！")
        }
        await this.bot.setAvatar(this.Path.qianyuPath + `resources/img/${e.self_id}.jpg`)
        await this.bot.setNickname(myuserinfo.nickname)
        this.bot.pickGroup(e.group_id).setCard(e.self_id, myuserinfo.nickname)
        await redis.del('qianyu:wz:iswz')
        await redis.del('qianyu:wz:InitiatorInfo')
        await this.timer.CancelTimeTask('wz');
        if (!cfg.masterQQ.includes(e.user_id)) {
            this.Config.SetCfg('wz', 'cishu.iscd', true)
            this.timer.SetTimeTask('wzcd', moment().add(this.Cfg.wzcd, 'm').format(), async () => {
                this.Config.SetCfg('wz', 'cishu.iscd', false)
            })
        }
        this.reply(`伪装任务已结束！伪装进入${this.Cfg.wzcd}分钟冷却cd！（主人除外！）`)
    }

    async wztask(e) {
        await this.timer.SetTimeTask('wz', moment().add(this.Cfg.wztime, 'm').format(), async () => {
            let myuserinfo = JSON.parse(await redis.get('qianyu:wz:myinfo'))
            await this.bot.setAvatar(this.Path.qianyuPath + `resources/img/${e.self_id}.jpg`)
            await this.bot.setNickname(myuserinfo.nickname)
            this.bot.pickGroup(e.group_id).setCard(e.self_id, myuserinfo.nickname)
            redis.del('qianyu:wz:iswz')
            redis.del('qianyu:wz:InitiatorInfo')
            e.reply(`伪装任务已结束！伪装进入${this.Cfg.wzcd}分钟冷却cd！（主人除外！）`)
            //进入cd
            if (!cfg.masterQQ.includes(e.user_id)) {
                this.Config.SetCfg('wz', 'cishu.iscd', true)
                await this.timer.SetTimeTask('wzcd', moment().add(this.Cfg.wzcd, 'm').format(), async () => {
                    this.Config.SetCfg('wz', 'cishu.iscd', false)
                })
            }

        })
    }

    clswz() {
        this.Config.SetCfg('wz', 'cishu', {
            sum: 0,
            userlist: [],
            iscd: false
        })
    }


}
