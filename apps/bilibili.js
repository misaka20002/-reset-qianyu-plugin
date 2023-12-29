import Bili from '../model/bilibili.js'
import moment from 'moment'
import { getupdateDynamic, pushdynamic, livepush, livepushall, getPushList, setUpPush, delUpPush } from './bilibili/dynamic.js'
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
                    reg: '^#订阅(UP|up|)(直播|文字|图文|视频|转发|抽奖|专栏|)(动态|)(uid:|UID:|)',
                    fnc: 'setUpPush'
                },
                {
                    reg: '^#取消订阅(UP|up|)(直播|文字|图文|视频|抽奖|转发|专栏|)(动态|)(uid:|UID:|)',
                    fnc: 'delUpPush'
                },
                {
                    reg: '^#查询(UP|up|)最新动态',
                    fnc: 'getupdateDynamic'
                },
                {
                    reg: '^#(取消|)直播推送全体',
                    fnc: 'livepushall'
                },
                {
                    reg: '^#搜索b站用户',
                    fnc: 'searchUser'
                }


            ]
        })
        this.e = e
        this.task = [
            {
                name: 'pushdynamic',
                fnc: 'pushdynamic',
                cron: `0 */${this.limitNumber(this.Cfg.dynamicTime, [1, 60])} * * * *`
            }, {
                name: 'livepush',
                fnc: 'livepush',
                cron: `10 */${this.limitNumber(this.Cfg.liveTime, [1, 60])} * * * *`
            }
        ]
    }


    //初始化操作
    async init() {
        this.File.DeleteAllFile('/resources/video')
    }

    limitNumber(num, arr) {
        if (num < arr[0]) {
            num = arr[0]
        } else if (num > arr[1]) {
            num = arr[1]
        }
        return num
    }

    async setCk(e) {
        if (!e.isMaster) return true
        if (e.isGroup) {
            return e.reply("请私聊发送cookie")
        }
        e.reply("请发送b站cookie")
        this.setContext('getBcookie', false, 120)
    }

    //动态推送
    async pushdynamic(e) {
        await pushdynamic.call(this, e)
    }

    //直播推送
    async livepush(e) {
        await livepush.call(this, e)
    }

    //直播推送全体
    async livepushall(e) {
        await livepushall.call(this, e)
    }

    //获取推送列表
    async getPushList(e) {
        await getPushList.call(this, e)
    }

    //获取最新动态up
    async getupdateDynamic(e) {
        await getupdateDynamic.call(this, e)
    }

    //获取ck
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


    //设置up推送
    async setUpPush(e) {
        await setUpPush.call(this, e)
    }

    //删除b站up动态推送
    async delUpPush(e) {
        await delUpPush.call(this, e)
    }

    //搜索用户
    async searchUser(e) {
        let name = e.msg.replace("#搜索b站用户", "")
        if (!name) {
            return e.reply("你还没有输入用户昵称呢！")
        }
        let data = await this.getSearchUser(name)
        if (!data) {
            return e.reply("没有找到该用户呢！")
        }
        let { uname, usign, fans, videos, upic, level, room_id } = data
        e.reply([this.segment.image("https:" + upic), `昵称:${uname}\n`, `等级：${level}\n`, `粉丝量：${this.computew(fans)}\n`, `视频量：${videos}\n`, `简介：${usign}`, room_id != 0 ? `\n直播间：https://live.bilibili.com/${room_id}` : ''])
    }

    //b站视频解析
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

    //删除缓存的b站的视频信息
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

    //查看历史解析的b站信息
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

    //视频合成
    async changeVideo(qn, bv, e) {
        let qnlist = [120, 116, 112, 80, 64, 32, 16]
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

    //处理url链接（不支持av链接）
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


    //自动选择视频质量
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

    //发送视频
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

    //下载b站文件
    async downBiliFile(url, path, suc) {
        return await this.downBilibiliVideo({
            url: url,
            headers: {
                'referer': `https://www.bilibili.com/`
            }
        }, path, suc)
    }

    //计算
    computew(num) {
        return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num
    }

    //添加空格
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

    //处理时间
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

// let b = new bilibili({ name: 'bilibili' })
// await b.getUpdateDynamicData('1542430267')