import { Api } from "../model/api.js"
import lodash from 'lodash'
export default class api extends Api {
    constructor() {
        super({
            name: 'api',
            priority: 50,
            rule: [
                {
                    reg: '^api帮助$',
                    fnc: 'apihelp'
                },
                {
                    reg: '^api检测$',
                    fnc: 'apitest'
                },
            ],
        })
        let datalist = this.getAllApilist()
        Object.keys(datalist).forEach(item => {
            if (datalist[item]) {
                this.rule.push({
                    reg: this.getreg(datalist[item]),
                    fnc: `get${item}`
                })
            }
        })
    }

    getreg(list) {
        let reg = ''
        list.forEach((item, index) => {
            reg += `${index == 0 ? '' : '|'}^${item.reg}`
            if (!item.range && item.range !== 'any') {
                reg += '$'
            }
        });
        return reg
    }


    async apitest(e) {
        let list = this.getAllApilist()
        for (let l in list) {
            if (!list[l]) continue
            list[l] = await this.testApi(list[l])
        }
        let apilist = [
            {
                name: '文本API',
                list: list.textapi
            },
            {
                name: '图片API',
                list: list.imageapi
            },
            {
                name: '视频API',
                list: list.videoapi
            },
            {
                name: '语音API',
                list: list.recordapi
            },
            {
                name: '音乐API',
                list: list.musicapi
            },
        ]
        apilist = apilist.filter(item => item.list)
        this.reply(await this.render('api', { apilist: apilist, radom: lodash.random(1, 4) }))
    }


    async apihelp(e) {
        let imglist = this.File.GetfileList('resources/img/可莉')
        let random = lodash.random(0, imglist.length - 1)
        let data = { helplist: [] }
        let apilist = this.getAllApilist()
        let titlelist = {
            imageapi: {
                icon: '248',
                title: '图片功能'
            },
            textapi: {
                icon: '101',
                title: '文本功能'
            },
            videoapi: {
                icon: '84',
                title: '视频功能'
            },
            recordapi: {
                icon: '82',
                title: '语音功能'
            },
            musicapi: {
                icon: '165',
                title: '音乐功能'
            }
        }
        for (let a in apilist) {
            if (!apilist[a]) continue
            let list = {
                title: titlelist[a].title,
                list: []
            }
            apilist[a].forEach(item => {
                list.list.push({
                    title: item.name,
                    desc: item.desc,
                    icon: titlelist[a].icon
                })
            })
            data.helplist.unshift(list)
        }
        data.bgimg = imglist[random]
        data.title = 'API帮助'
        return this.reply(await this.render('help', data))
    }

    async gettextapi(e) {
        let parm = '';
        let msg = e.msg
        let text = (await this.getApiList('text')).filter(item => {
            let reg = new RegExp(item.reg)
            if (reg.test(msg)) {
                return item
            }
        })
        if (text.length == 0) {
            return false
        } else if (text.length == 1) {
            text = text[0]
        } else if (text.length > 1) {
            let l = 0;
            text = text.filter((item, index) => {
                if (l == 0) {
                    l = item.reg.length
                } else {
                    l = text[index - 1].reg.length
                }
                if (item.reg.length > l) {
                    return item
                }
            })[0]
        }
        if (text.range) {
            if (Array.isArray(text.range)) {
                parm = text.range.find(item => msg.includes(item))
            } else if (text.range != 'any') {
                parm = text.range[msg]
            } else {
                let str = msg.match(text.reg)[0]
                parm = msg.replace(str, "")
            }
            if (text.parm) {
                parm += text.parm
            }
        }
        await this.getApiData('text', text.reg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            let remsg = res;
            res = res.replace(/[\r\n]/g, "")
            this.reply(remsg)
        }, encodeURI(parm))
    }

    async getrecordapi(e) {
        let parm = '';
        let msg = e.msg
        let record = (await this.getApiList('record')).find(item => {
            let reg = new RegExp(item.reg)
            if (reg.test(msg)) {
                return true
            }
        })
        if (record.range) {
            if (Array.isArray(record.range)) {
                parm = record.range.find(item => msg.includes(item))
            } else if (record.range != 'any') {
                parm = record.range[msg]
            } else {
                let str = msg.match(record.reg)[0]
                parm = msg.replace(str, "")
            }
            if (record.parm) {
                parm += record.parm
            }
        }
        await this.getApiData('record', record.reg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            this.reply(this.segment.record(res))
        }, encodeURI(parm))
    }

    async getimageapi(e) {
        let parm = '';
        let msg = e.msg
        let image = (await this.getApiList('image')).find(item => {
            let reg = new RegExp(item.reg)
            if (reg.test(msg)) {
                return true
            }
        })
        if (!image) return false
        if (image.range) {
            if (Array.isArray(image.range)) {
                parm = image.range.find(item => msg.includes(item))
            } else {
                parm = image.range[msg]
            }
            if (image.parm) {
                parm += image.parm
            }
        }
        await this.getApiData('image', image.reg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            if (!Array.isArray(res)) {
                await this.reply(this.segment.image(res))
            } else {
                let mes = []
                res.forEach((item, index) => {
                    if (res.length > 5 ? index < 5 : index < res.length) {
                        mes.push({ content: this.segment.image(item) })
                    }
                })
                return this.reply(await this.makeGroupMsg(e.msg, mes))
            }
        }, encodeURI(parm))
    }

    async getvideoapi(e) {
        let msg = e.msg
        let parm = '';
        let video = (await this.getApiList('video')).find(item => {
            let reg = new RegExp(item.reg)
            if (reg.test(msg)) {
                return true
            }
        })
        if (!video) return false
        if (video.range) {
            if (Array.isArray(video.range)) {
                parm = video.range.find(item => msg.includes(item))
            } else if (video.range != 'any') {
                parm = video.range[msg]
            } else {
                let str = msg.match(video.reg)[0]
                parm = msg.replace(str, "")
            }
            if (video.parm) {
                parm += video.parm
            }
        }
        await this.getApiData('video', video.reg, async (res) => {
            if (!res) {
                return this.reply("请求错误！请重试！")
            }
            if (video.data === 0) {
                const reg2 = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
                res = res.match(reg2)[0]
            }
            let result = await this.downVideoFile(res, `${msg}.mp4`, async () => {
                e.reply(this.segment.video(`${this.Path.qianyuPath}resources/video/${msg}.mp4`))
            })
            if (!result) {
                e.reply("视频下载失败！")
            }
        }, encodeURI(parm))

    }

    async downVideoFile(url, path, suc) {
        return await this.downVideo({
            url: url,
        }, path, suc)
    }
}