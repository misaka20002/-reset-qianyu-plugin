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
                },
                {
                    reg: '^#设置快手ck',
                    fnc: 'setCk',
                },
                {
                    reg: '^快手ck帮助',
                    fnc: 'kuaishouckhelp',
                },
            ],
        })
        this.e = e
    }

    async kuaishouckhelp(e) {
        this.reply('快手cookie获取流程：\n【腾讯文档】视频解析cookie获取教程https://docs.qq.com/doc/DSXlCckx1d0FxSkZE')
    }

    async setCk(e) {
        if (!e.isMaster) return true
        if (e.isGroup) {
            return e.reply("请私聊发送cookie")
        }
        e.reply("请发送快手cookie")
        this.setContext('geKscookie', false, 120)
    }

    async geKscookie() {
        let msg = this.e.msg
        this.ck = msg
        this.finish('geKscookie')
        return this.e.reply("快手cookie设置成功!")
    }

    async kjx(e) {
        if (!e.isGroup) return false
        let url = await this.dealUrl(e)
        if (!url) {
            return false
        }
        let videourl = await this.getKuaishouVideo(url)
        if (!videourl) {
            return this.reply("解析失败！可能是cookie失效，请发送'快手ck帮助'设置cookie!")
        }
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
