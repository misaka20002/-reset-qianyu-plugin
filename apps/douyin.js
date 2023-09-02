import Douyin from '../model/douyin.js'
export default class douyin extends Douyin {
    constructor() {
        super({
            name: 'douyin',
            priority: 50,
            rule: [
                {
                    reg: '^抖音搜索',
                    fnc: 'douyinSearch',
                },
                {
                    reg: '^#设置抖音ck',
                    fnc: 'setCk',
                },
                {
                    reg: '^抖音ck帮助',
                    fnc: 'douyinckhelp',
                },
                {
                    reg: '',
                    fnc: 'doujx',
                    log: false
                },

            ],
        })
    }

    async douyinckhelp(e) {
        this.reply('抖音cookie获取流程：\n【腾讯文档】抖音cookie获取教程https://docs.qq.com/doc/DSXlCckx1d0FxSkZE')
    }

    async setCk(e) {
        if (!e.isMaster) return true
        if (e.isGroup) {
            return e.reply("请私聊发送cookie")
        }
        e.reply("请发送抖音cookie")
        this.setContext('geDycookie', false, 120)
    }

    async geDycookie() {
        let msg = this.e.msg
        this.ck = msg
        this.finish('geDycookie')
        return this.e.reply("抖音cookie设置成功!")
    }

    async doujx(e) {
        if (!this.Cfg.isjx) return false
        let url = await this.dealUrl(e)
        if (!url) return false
        let id, result;
        if (url.includes('v.douyin')) {
            result = await this.getDouyinId(url)
            if (!result) {
                return this.reply("抖音链接错误！")
            }
        } else {
            let reg = /(video|note)\/\d+/g
            let id = url.match(reg)[0].split("/")[1]
            result = { type: url.match(reg)[0].split("/")[0], id: id }
        }
        if (result) {
            id = result.id
        }
        let resultinfo = await this.getDouyinVideo(`${id}`, result.type)
        if (!resultinfo?.resulturl) {
            return this.reply("解析失败！可能是cookie失效，请发送'抖音ck帮助'设置cookie!")

        }
        this.reply([`作者：${resultinfo.info.nickname}\n`, `描述：${resultinfo.info.desc}\n`, `解析类型：${result.type == 'video' ? '视频' : '图文'}`])
        if (result.type == 'video') {
            if (resultinfo.info.datasize >= 1024 * 1024 * 100) {
                return this.reply("视频过大，不支持解析！")
            }
            this.changeVideo(resultinfo.resulturl, e)
        } else {
            if (Array.isArray(resultinfo.resulturl)) {
                let meg = resultinfo.resulturl.map(item => {
                    return { content: this.segment.image(item) }
                })
                this.reply(await this.makeGroupMsg(resultinfo.info.desc, meg))
            }

        }

    }

    async douyinSearch(e) {
        let msg = e.msg.replace("抖音搜索", "")
        let res = await new this.networks({ url: 'http://api.xn--7gqa009h.top/api/dyss?msg=' + encodeURI(msg), type: 'json' }).getData()
        res = JSON.parse(res).video
        if (!res) return this.reply("搜索失败！")
        this.reply([res.bt, this.segment.image(res.fm)])
        if (res.sp.includes(".mp3")) {
            res = res.fm
        } else {
            res = res.sp
        }
        if (res.includes('.douyinpic')) {
            return e.reply(this.segment.image(res))
        }
        this.changeVideo(res, e)
    }

    async dealUrl(e) {
        if (!e.url) return false
        let url = e.url;
        let urllist = ['v.douyin', 'www.douyin.com']
        let reg2 = new RegExp(`${urllist[0]}|${urllist[1]}`)
        if (!url.match(reg2)) return false
        return url
    }

    async sendVideo(videoPath, e, faith = () => { }) {
        let result = await Bot.pickGroup(e.group_id).sendMsg(this.segment.video(videoPath)).catch(async (err) => {
            await faith()
            logger.warn(err)
        })
        if (!result) return false
        let res = await Bot.getMsg(result.message_id)
        if (res.message[0].fid.length < 3) {
            e.group.recallMsg(result.message_id)
            await this.common.sleep(1000)
            await this.sendVideo(videoPath, e)
        }
        return true
    }

    async changeVideo(url, e) {
        let videoPath = this.Path.qianyuPath + `resources/video/douyin.mp4`
        let douyin = await this.downDouyinFile(url, `douyin.mp4`, () => { })
        if (douyin) {
            let isSend = await this.sendVideo(videoPath, e, async () => {
                this.reply("视频解析失败！")
            })
            if (isSend) {
                this.File.deleteFile(videoPath)
            }
        }
    }

    async downDouyinFile(url, path, suc) {
        return await this.downVideo({
            url: url,
        }, path, suc)
    }
}