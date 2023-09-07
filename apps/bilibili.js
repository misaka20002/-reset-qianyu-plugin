import Bili from '../model/bilibili.js'
import moment from 'moment'
import lodash from 'lodash'
export default class bilibili extends Bili {
    constructor(e) {
        super({
            name: 'bilibili',
            priority: 50,
            rule: [
                {
                    reg: '',
                    fnc: 'bili',
                    log: false
                },
                {
                    reg: '^#历史b站视频',
                    fnc: 'historyBilibiliVideo'
                },
                {
                    reg: '^#设置b站ck',
                    fnc: 'setCk'
                },
                {
                    reg: '^#删除b站视频',
                    fnc: 'deleteBilibili'
                },
                {
                    reg: '^#订阅列表$',
                    fnc: 'getPushList'
                },
                {
                    reg: '^#订阅(UP|up|)(动态|)(uid:|UID:|)',
                    fnc: 'setUpPush'
                },
                {
                    reg: '^#取消订阅(UP|up|)(动态|)(uid:|UID:|)',
                    fnc: 'delUpPush'
                },
                {
                    reg: '^#查询(UP|up|)最新动态',
                    fnc: 'getmydynamic'
                },
                {
                    reg: '^#(取消|)直播推送全体',
                    fnc: 'livepushall'
                }


            ]
        })
        this.e = e
        this.task = [
            {
                name: 'pushdynamic',
                fnc: 'pushdynamic',
                cron: '0 */5 * * * *'
            }, {
                name: 'livepush',
                fnc: 'livepush',
                cron: '10 * * * * *'
            }
        ]
    }


    async init() {
        this.File.DeleteAllFile('/resources/video')
    }

    async setCk(e) {
        if (!e.isMaster) return true
        if (e.isGroup) {
            return e.reply("请私聊发送cookie")
        }
        e.reply("请发送b站cookie")
        this.setContext('getBcookie', false, 120)
    }

    async pushdynamic() {
        let groupList = Bot.gl
        for (let g of groupList) {
            let updata = this.getBilibiUpPushData(g[0])
            for (let item of Object.values(updata)) {
                let data = await this.getUpdateDynamicData(item.uid)
                if (!data) continue
                if (data.code) continue
                if (data.id !== item.upuid) {
                    let bglist = this.File.GetfileList('resources/html/bilibili/bg')
                    let radom = bglist[lodash.random(0, bglist.length - 1)]
                    Bot.pickGroup(g[0]).sendMsg(this.render('bilibili', { radom, ...data }))
                    data = {
                        nickname: data.author.nickname,
                        upuid: data.id,
                        uid: item.uid,
                        img: data.author.img,
                        pendantImg: data.author.pendantImg,
                    }
                    updata[item.uid] = data
                    this.setBilibiUpPushData(g[0], updata)
                }
            }
        }
    }

    async livepush() {
        let groupList = Bot.gl
        for (let g of groupList) {
            let updata = this.getBilibiUpPushData(g[0])
            for (let item of Object.values(updata)) {
                let liveData = await this.getRoomInfobymid(item.uid)
                let data = {}
                if (liveData.live_status == 1 && !updata[item.uid].liveData) {
                    let text = '', imglist = '', video, orig = '', liveInfo, comment = ''
                    data.type = "直播"
                    data.erm = "https://live.bilibili.com/" + liveData.room_id
                    data.id = liveData.room_id
                    updata[item.uid].liveData = liveData
                    liveInfo = {
                        cover: liveData.user_cover,
                        title: liveData.title,
                        live_time: liveData.live_time,
                        area_name: liveData.area_name,
                        watched_show: liveData.online
                    }
                    data.author = {
                        nickname: updata[item.uid].nickname,
                        img: updata[item.uid].img,
                        pendantImg: updata[item.uid].pendantImg
                    }
                    let isatall = updata[item.uid]?.isatall ? this.segment.at('all') : ''
                    let msg = isatall ? `  ${updata[item.uid].nickname}开播啦！小伙伴们快去围观吧！` : '';
                    let bglist = this.File.GetfileList('resources/html/bilibili/bg')
                    let radom = bglist[lodash.random(0, bglist.length - 1)]
                    data = { ...data, text, imglist, video, orig, liveInfo, comment, date: moment(liveData.live_time).format("YYYY年MM月DD日 HH:mm:ss") }
                    Bot.pickGroup(g[0]).sendMsg([isatall, msg, this.render('bilibili', { radom, ...data })])
                }
                if (liveData.live_status != 1) {
                    updata[item.uid].liveData?.live_time ? Bot.pickGroup(g[0]).sendMsg([this.segment.image(liveData.user_cover), '主播下播la~~~~\n', `本次直播时长：${this.getDealTime(moment(updata[item.uid].liveData.live_time), moment())}`]) : ''
                    delete updata[item.uid].liveData
                }
                this.setBilibiUpPushData(g[0], updata)
            }
        }
    }

    async livepushall(e) {
        let mid = e.msg.replace(/#(取消|)直播推送全体/g, "")
        let isatall = true
        if (isNaN(mid)) {
            return this.reply("up主UID不正确，请输入数字！")
        }

        let updata = this.getBilibiUpPushData(e.group_id) || {}
        if (!updata[mid]) {
            return this.reply("你还没订阅这个up主呢！")
        }
        let info = await Bot.getGroupMemberInfo(e.group_id, Bot.uin)
        if (info.role != 'owner' && info.role != 'admin') {
            return this.reply("我不是管理员不能@全体呢！")
        }
        if (e.msg.includes("取消")) {
            isatall = false
        }
        updata[mid] = { ...updata[mid], isatall: isatall }
        this.setBilibiUpPushData(e.group_id, updata)
        this.reply(`已${isatall ? '设置' : '取消'}${updata[mid].nickname}的直播推送@全体！`)
    }

    async getPushList(e) {
        let updata = this.getBilibiUpPushData(e.group_id) || {}
        let msg = '订阅列表如下：'
        if (Object.keys(updata).length === 0) {
            return this.reply("这个群还没订阅任何up主呢！")
        }
        Object.values(updata).forEach(item => {
            msg += `\n昵称：${item.nickname}  uid:${item.uid}`
        })
        this.reply(msg)
    }

    async getmydynamic(e) {
        let mid = e.msg.replace(new RegExp(e.reg), "")
        if (isNaN(mid)) {
            return this.reply("up主UID不正确，请输入数字！")
        }
        let data = await this.getUpdateDynamicData(mid, 0)
        if (data?.code && data.code != 0) {
            return e.reply(reslut.message || reslut.msg)
        } else if (data.code == 0) {
            return this.reply("这个up还没发布过动态呢！")
        }
        let bglist = this.File.GetfileList('resources/html/bilibili/bg')
        let radom = bglist[lodash.random(0, bglist.length - 1)]
        this.reply(this.render('bilibili', { radom, ...data }))
    }

    async getUpdateDynamicData(mid, index) {
        let data = await this.getUpdateDynamic(mid, index)
        if (data.type == '直播') {
            data.erm = data.liveInfo.liveurl
            data.id = data.liveInfo.live_id
        }
        return data
    }

    async getBcookie() {
        let msg = this.e.msg
        if (msg && msg.includes("SESSDATA")) {
            this.Cfg = {
                key: 'cookie',
                value: msg
            }
            this.finish('getBcookie')
            return this.e.reply("cookie设置成功!")
        }
        return this.e.reply("cookie格式不正确!")
    }


    async setUpPush(e) {
        let mid = e.msg.replace(new RegExp(e.reg), "")
        if (isNaN(mid)) {
            return this.reply("up主UID不正确，请输入数字！")
        }
        let reslut = await this.getUpdateDynamic(mid, 0)
        let updata = this.getBilibiUpPushData(e.group_id) || {}
        if (reslut?.code && reslut.code != 0) {
            return e.reply(reslut.message || reslut.msg)
        }
        let data;
        if (!reslut.code) {
            data = {
                nickname: reslut.author.nickname,
                upuid: reslut.id,
                uid: mid,
                img: reslut.author.img,
                pendantImg: reslut.author.pendantImg
            }
        } else {
            let authorInfo = await this.getUserInfo(mid)
            data = {
                nickname: authorInfo.name,
                upuid: 0,
                uid: mid,
                img: authorInfo.face,
                pendantImg: authorInfo.pendant?.image
            }
        }
        updata[mid] = data
        this.setBilibiUpPushData(e.group_id, updata)
        return e.reply(`Up主${data.nickname}订阅成功！`)
    }

    async delUpPush(e) {
        let mid = e.msg.replace(new RegExp(e.reg), "")
        if (isNaN(mid)) {
            return this.reply("up主UID不正确，请输入数字！")
        }
        let updata = this.getBilibiUpPushData(e.group_id)
        let uplist = Object.keys(updata)
        let result = updata[mid]
        if (!uplist.includes(mid)) {
            return e.reply("暂未订阅该up主！")
        } else {
            delete updata[mid]
        }
        this.setBilibiUpPushData(e.group_id, updata)
        return e.reply(`取消订阅Up主${result.nickname}成功！`)
    }

    async bili(e) {
        if (!e.isGroup) return false
        if (!this.Cfg.isjx) return false
        let bv = await this.dealUrl(e)
        if (!bv) return false
        let videoInfo = {};
        videoInfo = await this.getVideoInfo(bv)
        if (videoInfo.duration >= 1800) {
            return e.reply("视频太长了，还是去b站去看吧!")
        }
        let qn = this.autoQuality(videoInfo.duration, e)
        if (this.Cfg.card) {
            e.reply([this.segment.image(videoInfo.pic), `标题: ${videoInfo.title}\n`, `作者: ${videoInfo.owner.name}\n`, `${this.addnull(`播放量: ${this.computew(videoInfo.stat.view)} 弹幕: ${this.computew(videoInfo.stat.danmaku)}`, '弹')}\n`, `${this.addnull(`点赞: ${this.computew(videoInfo.stat.like)}投币: ${this.computew(videoInfo.stat.coin)}`, '投')}`, `\n${this.addnull(`收藏: ${this.computew(videoInfo.stat.favorite)}转发: ${this.computew(videoInfo.stat.share)}`, '转')}`])
        }
        if (this.getVideoAllList().includes(bv)) {
            await this.common.sleep(1000)
            return this.sendVideo(bv, e, '', this.getVideo(bv))
        }
        await this.changeVideo(qn, bv, e)
    }

    async deleteBilibili(e) {
        if (!e.isMaster) return
        if (!e.source && e.source?.message !== '[视频]') {
            return e.reply("不存在视频源！")
        }
        let seq = e.source.seq
        let { md5 } = (await e.group.getChatHistory(seq, 1))[0].message[0]
        let reslut = this.deleteBilibiliData(md5)
        if (!reslut) {
            return e.reply("未收录该b站视频！")
        }
        return e.reply("b站视频删除成功！");
    }

    async historyBilibiliVideo(e) {
        let biliList = this.getGroupBilibiliData(e.group_id) || []
        if (e.group_id) {
            if (biliList.length == 0) {
                return e.reply("这个群还没有解析过b站视频！")
            } else {
                let videolist = [];
                for (let b of biliList) {
                    videolist.push({ content: `https://www.bilibili.com/${b.bv}`, time: b.time }, { content: this.getVideo(b.bv), time: b.time })
                }
                return e.reply(await this.makeGroupMsg('历史b站视频', videolist))
            }
        }
    }

    async changeVideo(qn, bv, e) {
        let qnlist = [120, 116, 112, 80, 64, 32]
        let videoPath = this.Path.qianyuPath + `resources/video/source_${bv}.mp4`
        let resultPath = this.Path.qianyuPath + `resources/video/${bv}.mp4`
        let { videoUrl, audio } = await this.getQnVideo(qn, bv)
        let audioPath = this.Path.qianyuPath + `resources/video/source_${bv}.mp3`
        let bilibi = await this.downBiliFile(videoUrl, `source_${bv}.mp4`, () => { })
        let ado = await this.downBiliFile(audio, `source_${bv}.mp3`, () => { })
        if (bilibi && ado) {
            await this.compositeBiliVideo(videoPath, audioPath, resultPath, async () => {
                let isSend = await this.sendVideo(bv, e, resultPath, '', async () => {
                    qn = qnlist[qnlist.indexOf(qn) + 1]
                    await this.changeVideo(qn, bv, e)
                })
                if (isSend) {
                    this.File.deleteFile(videoPath)
                    this.File.deleteFile(audioPath)
                    this.File.deleteFile(resultPath)
                }

            }, () => {
                this.File.deleteFile(videoPath)
                this.File.deleteFile(audioPath)
            })

        }
    }

    async dealUrl(e) {
        if (!e.json && !e.url) return false
        let url = e.url
        let urllist = ['b23.tv', 'm.bilibili.com', 'www.bilibili.com']
        let reg2 = new RegExp(`${urllist[0]}|${urllist[1]}|${urllist[2]}`)
        if (e.json) {
            let json = e.json
            url = json.meta.detail_1?.qqdocurl || json.meta.news?.jumpUrl
        }
        if (!url || !url.match(reg2)) return false
        let bilireg = /(BV.*?).{10}/
        let bv = url.match(bilireg)
        if (bv) {
            //存在bv长链接
            bv = bv[0]
        } else {
            //不存在长链接
            let data = await new this.networks({ url: url }).getfetch()
            bv = data.url.match(bilireg)[0]
        }
        return bv
    }


    autoQuality(duration, e) {
        let qn = this.Cfg.qn
        if (duration < 120) {
            qn = 120
        }
        else if (duration >= 120 && duration < 180) {
            qn = 112
        } else if (duration >= 180 && duration < 300) {
            qn = 80
        } else if (duration >= 300 && duration < 480) {
            e.reply("视频时长超过5分钟，已将视频画质降低至720p")
            qn = 64
        } else if (duration >= 480 && duration < 720) {
            e.reply("视频时长超过8分钟，已将视频画质降低至480p")
            qn = 32
        } else if (duration >= 720) {
            e.reply("视频时长超过12分钟，已将视频画质降低至360p")
            qn = 16
        }
        return qn
    }

    async sendVideo(bv, e, videoPath, data, faith = () => { }) {
        let result = await Bot.pickGroup(e.group_id).sendMsg(data || this.segment.video(videoPath)).catch(async (err) => {
            await faith()
            logger.warn(err)
        })
        if (!result) return false
        let res = await Bot.getMsg(result.message_id)
        if (res.message[0].fid.length < 3) {
            e.group.recallMsg(result.message_id)
            await this.common.sleep(1000)
            await this.sendVideo(bv, e, videoPath, data)
        } else {
            this.setBilibiliData(res.message[0], bv)
            this.setGroupBilibiliData(e.group_id, { bv: bv, time: e.time })
        }
        return true
    }

    async downBiliFile(url, path, suc) {
        return await this.downBilibiliVideo({
            url: url,
            headers: {
                'referer': `https://www.bilibili.com/`
            }
        }, path, suc)
    }

    computew(num) {
        return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num
    }

    addnull(str, target, centerIndex = 14) {
        let idx = str.indexOf(target)
        let strlist = str.split(`${target}`)
        let replaceStr = '  '
        if (idx == centerIndex) {
            return str
        } else if (idx < 7) {
            replaceStr = 'ㅤ'
        }
        let arr = Array.from(str)
        let index = centerIndex - strlist[0].length
        for (let i = 0; i < index; i++) {
            if (/^[a-zA-Z]*$/.test(strlist[0].trim())) {
                arr.splice(idx, 0, ' ')
            }
            arr.splice(idx, 0, replaceStr)
        }
        return arr.join('')
    }

    getDealTime(stime, etime) {
        let str = ''
        let dura = etime.format('x') - stime.format('x');
        let tempTime = moment.duration(dura);
        str += tempTime.years() ? tempTime.years() + '年' : ''
        str += tempTime.months() ? tempTime.months() + '月' : ''
        str += tempTime.days() ? tempTime.days() + '日' : ''
        str += tempTime.hours() ? tempTime.hours() + '小时' : ''
        str += tempTime.minutes() ? tempTime.minutes() + '分钟' : ''
        return str
    }


}
