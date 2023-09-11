import Video from '../model/video.js'
export default class QQworld extends Video {
    constructor(e) {
        super({
            name: 'qqworld',
            priority: 50,
            rule: [
                {
                    reg: '',
                    fnc: 'xuijx',
                    log: false
                }
            ],
        })
        this.e = e
    }

    async xuijx(e) {
        if (!e.isGroup) return false
        let url = await this.dealUrl(e)
        if (!url) {
            return false
        }
        await this.changeVideo(url, e)
    }

    async dealUrl(e) {
        if (!e.json) return false
        let url;
        let urllist = ['photo.qq.com']
        let reg2 = new RegExp(`${urllist[0]}`)
        if (e.json) {
            let json = e.json
            url = json.meta.data?.feedInfo.videoInfo?.playUrl || undefined
        }
        if (!url || !url.match(reg2)) return false
        return url
    }

    async sendVideo(videoPath, e, faith = () => { }) {
        let result = await Bot.pickGroup(e.group_id).sendMsg(this.segment.video(videoPath)).catch(async (err) => {
            await faith()
            logger.warn(err)
        })
        if (!result) return false
        let res = await Bot.getMsg(result.message_id)
        if (res?.message[0].fid.length < 3) {
            e.group.recallMsg(result.message_id)
            await this.common.sleep(1000)
            await this.sendVideo(videoPath, e)
        } else {
            this.setVideoDataByName(res.message[0], "qqworld")
        }
        return true
    }

    async changeVideo(url, e) {
        let videoPath = this.Path.qianyuPath + `resources/video/qqworld.mp4`
        let qqworld = await this.downQQworldFile(url, `qqworld.mp4`, () => { })
        if (qqworld) {
            let isSend = await this.sendVideo(videoPath, e, async () => {
                await this.changeVideo(url, e)
            })
            if (isSend) {
                this.File.deleteFile(videoPath)
            }
        }
    }

    async downQQworldFile(url, path, suc) {
        return await this.downVideo({
            url: url,
        }, path, suc)
    }


}
