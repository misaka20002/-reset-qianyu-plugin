import Base from "./base/Base.js";
export class Api extends Base {

    constructor(data) {
        super(data)
    }

    getApiByname(name) {
        let apilist = this.getAllApilist()
        let list = []
        for (let l in apilist) {
            list.push(...apilist[l].map(it => { return { ...it, type: l.replace('api', "") } }))
        }
        return list.find(item => item.name === name)
    }

    async getApiData(type, name, suc, parms = '') {
        let datalist = await this.getApiList(type)
        datalist.forEach(async element => {
            if (element.reg === name) {
                let url = element.url + parms
                await this.dealType(url, element, suc)
            }
        });
    }

    async testApi(list) {
        let newlist = []
        for (let element of list) {
            let parm = ''
            if (element.range) {
                if (Array.isArray(element.range)) {
                    parm = element.range[0]
                } else if (element.range !== 'any') {
                    parm = element.range[Object.keys(element.range)[0]]
                }
                if (element.parm) {
                    parm += element.parm
                }
            }
            let url = element.url + parm
            let api = await this.dealType(url, element, (code) => {
                code = code || 500
                return { name: element.name, code: code }
            }, 'test', element.name)
            newlist.push(api)
        }
        return newlist
    }




    async dealType(url, data, suc, test = '', name) {
        let type = 'json'
        if (data.data === 1 && test !== 'test') {
            return suc(url)
        } else if (data.data === 0) {
            type = 'text'
        }
        let networks = new this.networks({
            url: url, type: type,
            isAgent: data.isAgent || false,
            issignal: true,
            name: name
        })
        let fetch = await networks.getfetch()
        let code = fetch.status
        if (code !== 200) {
            return suc(false)
        }
        if (test === 'test') {
            return suc(code)
        }
        networks.getData(fetch).then(async res => {
            if (type == 'json' && networks.type === 'json') {
                data.data.forEach(item => {
                    res = res[item]
                })
            } else if (type === 'json' && networks.type === 'text') {
                res = res.replace('json:', "").replace(/[\r\n]/g, "")
                res = JSON.parse(res)
                data.data.forEach(item => {
                    res = res[item]
                })
            }
            return suc(res)
        })
    }

    getApiList(type) {
        if (type == 'text') {
            let { textapi } = this.File.getYamlData('resources/api/text.yaml')
            return textapi
        } else if (type == 'image') {
            let { imagelist } = this.File.getYamlData('resources/api/image.yaml')
            return imagelist
        }
        else if (type == 'record') {
            let { recordapi } = this.File.getYamlData('resources/api/record.yaml')
            return recordapi
        }
        else if (type == 'video') {
            let { videoapi } = this.File.getYamlData('resources/api/video.yaml')
            return videoapi
        }
        else if (type == 'music') {
            let { musiclist } = this.File.getYamlData('resources/api/music.yaml')
            return musiclist
        }
    }

    getAllApilist() {
        let list = ['text', 'image', 'record', 'video', 'music']
        let result = {}
        for (let l of list) {
            result[`${l}api`] = this.getApiList(l)
        }
        return result
    }

    async downVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }
}
//console.log(await new Api({ name: 'api' }).testApi(new Api({ name: 'api' }).getApiList('video')));