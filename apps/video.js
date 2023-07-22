import Video from "../model/video.js"
import lodash from 'lodash'
export default class video extends Video {
    constructor(e) {
        super({
            name: 'video',
            priority: 10000,
            rule: [
                {
                    reg: '^#创建目录',
                    fnc: 'creatVideoJson'
                },
                {
                    reg: '^#随机',
                    fnc: 'getRadomVideo'
                },
                {
                    reg: '^#收录',
                    fnc: 'collectVideo'
                },
                {
                    reg: '^#查看收录列表',
                    fnc: 'getVideoStatistics'
                },
            ],
        })
        this.e = e
    }

    async creatVideoJson(e) {
        if (!e.isMaster) return
        let msg = e.msg.replace("#创建目录", "")
        if (!this.isextisVideoJson(msg)) {
            this.setVideoDataByName({}, msg)
            e.reply("创建目录成功！");
        } else {
            e.reply("该目录已存在！");
        }
    }


    async getVideoStatistics(e) {
        let ignore = ['bilibilivideo', 'groupbilibilivideo', 'qqworld']
        let videolist = this.File.GetfileList('data/video').map(item => item.replace(".json", "")).filter(item => !ignore.includes(item))
        let st = '当前收录的视频如下：\n'
        let str = ''
        videolist.forEach((item, index) => {
            let { num } = this.getCollectVideoInfo(item)
            if (index % 2 == 1 && index !== videolist.length - 1) {
                str += item + ' : ' + num + '\n'
            } else {
                str += item + ' : ' + num
            }

        })
        let list = str.split("\n").map(item => {
            let sr = item.split(/[0-9]+/)
            return this.addnull(item, sr[1][0], 12)
        }).join('\n')
        e.reply([st, ...list])
    }

    getCollectVideoInfo(v) {
        let info = this.Data.getDataJson(`video/${v}`)
        return { num: Object.keys(info).length, data: Object.values(info) }
    }

    async getRadomVideo(e) {
        let msg = e.msg.replace("#随机", "")
        if (!this.isextisVideoJson(msg)) {
            e.reply("不存在视频目录，请先创建目录！");
        } else {
            let videoData = this.getVideoDataByName(msg)
            let radom = lodash.random(0, Object.keys(videoData).length - 1)
            let data = videoData[Object.keys(videoData)[radom]]
            e.reply(data)
        }
    }

    async collectVideo(e) {
        if (!e.isMaster) return
        let msg = e.msg.replace("#收录", "")
        if (!e.source && e.source?.message !== '[视频]') {
            return e.reply("不存在视频源！")
        }
        let seq = e.source.seq
        if (!this.isextisVideoJson(msg)) {
            e.reply("不存在视频目录，请先创建目录！");
        } else {
            let result = this.setVideoDataByName((await e.group.getChatHistory(seq, 1))[0].message[0], msg)
            if (!result) {
                return e.reply("已收录过视频！");
            }
            return e.reply("视频收录成功！");
        }
    }

    isextisVideoJson(name) {
        let videolist = this.File.GetfileList('data/video').map(item => item.replace('.json', ""))
        if (!videolist.includes(name)) {
            return false
        }
        return true
    }


    addnull(str, target, centerIndex = 14) {
        let idx = str.indexOf(target)
        let strlist = str.split(`${target}`)
        let replaceStr = 'ㅤ'
        if (idx == centerIndex) {
            return str
        }
        let arr = Array.from(str)
        let index = centerIndex - strlist[0].length - 1
        for (let i = 0; i < index; i++) {
            if (/^[a-zA-Z]/.test(strlist[0].trim())) {
                arr.splice(idx, 0, ' ')
            }
            arr.splice(idx, 0, replaceStr)
        }
        return arr.join('')
    }
}
