import Kuaishou from '../model/kuaishou.js'
export default class kuaishou extends Kuaishou {
    constructor(e) {
        super({
            name: 'kuaishou',
            priority: 50,
            rule: [
                {
                    reg: '',
                    fnc: 'kjx',
                    log: false
                }
            ],
        })
        this.e = e
    }

    async kjx(e) {
        let url = await this.dealUrl(e)
        if (!url) {
            return false
        }
        let videourl = await this.getKuaishouVideo(url)
        await this.changeVideo(videourl, e)
    }

    async dealUrl(e) {
        let url = e.url;
        let urllist = ['kuaishou.com']
        let reg2 = new RegExp(`${urllist[0]}`)
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
        if (res.message[0].fid.length < 3) {
            e.group.recallMsg(result.message_id)
            await this.common.sleep(1000)
            await this.sendVideo(videoPath, e)
        } else {
            this.setVideoDataByName(res.message[0], "qqworld")
        }
        return true
    }

    async changeVideo(url, e) {
        let videoPath = this.Path.qianyuPath + `resources/video/kuaishou.mp4`
        let kuaishou = await this.downQQworldFile(url, `kuaishou.mp4`, () => { })
        if (kuaishou) {
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
