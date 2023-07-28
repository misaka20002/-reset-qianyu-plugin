import Douyin from '../model/douyin.js'
export default class douyin extends Douyin {
    constructor() {
        super({
            name: 'douyin',
            priority: 50,
            rule: [
                {
                    reg: '',
                    fnc: 'doujx',
                    log: false
                },
            ],
        })
    }

    async doujx(e) {
        let url = await this.dealUrl(e)
        if (!url) return false
        let id = await this.getDouyinId(url)
        if (!id) {
            return this.reply("抖音解析只支持短链接分享！")
        }
        let videoUrl = await this.getDouyinVideo(`${id}`)
        if (!videoUrl) {
            return this.reply("解析失败！")
        }
        this.changeVideo(videoUrl, e)
    }

    async dealUrl(e) {
        if (!e.url) return false
        let url = e.url;
        let urllist = ['v.douyin']
        let reg2 = new RegExp(`${urllist[0]}`)
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