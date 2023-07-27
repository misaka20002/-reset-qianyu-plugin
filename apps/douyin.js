import Base from '../model/base/Base.js'
export default class douyin extends Base {
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
        return false
        let url = await this.dealUrl(e)
        if (!url) {
            return false
        }
        await this.getdouyinVideo(url)
        //await this.changeVideo(url, e)
    }

    async getdouyinVideo(url) {
        let data = await new this.networks({ url: url }).getfetch()
        url = data.url.split('?')[0]
        let networks = new this.networks({ url: url, type: 'text' })
        networks.getData().then(res => {
            console.log(res);
            let url = res.match('www.douyin.com/aweme/v1/play/')
            console.log(url);
        })
    }

    async dealUrl(e) {
        if (!e.url && !e.json) return false
        let url = e.url;
        let urllist = ['v.douyin']
        let reg2 = new RegExp(`${urllist[0]}`)
        if (e.json) {
            let json = e.json
            url = json.meta.data?.feedInfo.videoInfo?.playUrl || undefined
        }
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