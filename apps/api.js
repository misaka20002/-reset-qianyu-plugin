import { Api } from "../model/api.js"
import lodash from 'lodash'
let videoing = false
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
        if (!e.isMaster) return true
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


    async dealApi(type, msg, suc) {
        let parm = '';
        let api = (await this.getApiList(type)).filter(item => {
            let reg = new RegExp(item.reg)
            if (reg.test(msg)) {
                return item
            }
        })
        if (api.length == 0) {
            return false
        } else if (api.length == 1) {
            api = api[0]
        } else if (api.length > 1) {
            let l = 0;
            api = api.filter((item, index) => {
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
        if (api.replace) {
            msg = msg.replace(api.replace, "")
        }
        if (api.range) {
            if (Array.isArray(api.range)) {
                parm = api.range.find(item => msg.includes(item))
            } else if (api.range !== 'any') {
                parm = api.range[msg]
            } else {
                let str = msg.match(api.reg)[0]
                parm = msg.replace(str, "")
            }
            if (api.parm) {
                parm += api.parm
            }
        }
        await this.getApiData(type, api.reg, async (res) => {
            suc(res, api)
        }, encodeURI(parm))
    }

    async gettextapi(e) {
        let msg = e.msg
        await this.dealApi('text', msg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            let remsg = res.trim();
            remsg = remsg.replace(/\\n/g, "\n")
            this.reply(remsg)
        })
    }

    async getrecordapi(e) {
        let msg = e.msg
        await this.dealApi('record', msg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            this.reply(this.segment.record(res))
        })
    }

    async getmusicapi(e) {
        let msg = e.msg
        await this.dealApi('music', msg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            this.reply(this.segment.record(res))
        })
    }

    async getimageapi(e) {
        let msg = e.msg
        await this.dealApi('image', msg, async (res) => {
            if (!res) {
                return this.reply("请求失败！")
            }
            if (!Array.isArray(res)) {
                await this.reply(this.segment.image(res))
            } else {
                let mes = []
                res = [...new Set(res)]
                res.forEach((item, index) => {
                    // if (res.length > 5 ? index < 5 : index < res.length) {
                    mes.push({ content: this.segment.image(item) })
                    // }
                })
                return this.reply(await this.makeGroupMsg(e.msg, mes))
            }
        })
    }

    async getvideoapi(e) {
        let msg = e.msg
        if (videoing) {
            return this.reply("当前有视频任务正在下载请稍后！")
        }
        videoing = true
        await this.dealApi('video', msg, async (res, video) => {
            if (!res) {
                videoing = false
                return this.reply("请求错误！请重试！")
            }
            if (video.data === 0) {
                const reg2 = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
                res = res.match(reg2)[0]
            }
            let result = await this.downVideoFile(res, `${msg}.mp4`, async () => {
                Bot.pickGroup(this.e.group_id).sendMsg(this.segment.video(`${this.Path.qianyuPath}resources/video/${msg}.mp4`)).catch(err => {
                    videoing = false
                    return e.reply("视频解析失败！")
                })
            })
            videoing = false
            if (!result) {
                return e.reply("视频下载失败！")
            }
        })

    }

    async downVideoFile(url, path, suc) {
        return await this.downVideo({
            url: url,
        }, path, suc)
    }
}