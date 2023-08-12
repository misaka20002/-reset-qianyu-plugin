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
                    reg: '',
                    fnc: 'doujx',
                    log: false
                },
            ],
        })
    }

    async doujx(e) {
        if (!this.Cfg.isjx) return false
        let url = await this.dealUrl(e)
        if (!url) return false
        let id;
        if (url.includes('v.douyin')) {
            id = await this.getDouyinId(url)
            if (!id) {
                return this.reply("抖音解析只支持短链接分享！")
            }
        } else {
            let reg = /video\/(.*?)\//g
            if (Array.isArray(url.match(reg))) {
                id = url.match(reg)[0].split("/")[1]
            } else {
                let r = url.match(reg).splite('\/')
                id = r[1]
            }

        }
        let videoUrl = await this.getDouyinVideo(`${id}`)
        if (!videoUrl) {
            return this.reply("解析失败！")
        }
        this.changeVideo(videoUrl, e)
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
                await this.changeVideo(url, e)
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