import lodash from 'lodash'
import AI from '../model/ai.js'
export default class ai extends AI {
    constructor() {
        super({
            name: 'ai',
            priority: 1000,
            rule: [
                // {
                //     reg: '^文心',
                //     fnc: 'wenxin',
                // },
                {
                    reg: '',
                    fnc: 'ffai',
                    log: false
                },
            ]
        })

        this.def_gaiCfg = {
            isOpen: false,
            aiType: "思知",
            gprobability: 0
        }
    }

    async ffai(e) {
        let config = this.Cfg
        let radom = lodash.random(1, 100)
        if (e.isGroup) {
            let gcfg = { ...this.def_gaiCfg, ...config[e.group_id] }
            if (e.user_id == e.self_id) return false
            if (!gcfg.isOpen) return false
            if (e.atBot || e.hasAlias) {
                return await this.getai(gcfg.aiType)
            }
            if (gcfg.isOpen && radom <= gcfg.gprobability) {
                return await this.getai(gcfg.aiType)
            }
        }
        if (e.isPrivate) {
            if (config.isPrivate == false) return ""
            if (radom <= config.probability) {
                return await this.getai(config.aiType)
            }
        }
        return false
    }

    async getai(aiType) {
        return await this.choieai(this.e.msg, aiType)
    }

    async choieai(msg, ai) {
        let ailist = this.File.getYamlData('resources/api/ai.yaml').ailist
        let botname = this.Cfg.botname
        let imglist = this.File.GetfileList('resources/img/noresult')
        let aida = ailist.find(list => list.name == ai)
        if (!aida) return
        if (!msg) {
            return this.reply(this.segment.image(`${this.Path.qianyuPath}resources/img/noresult/${imglist[lodash.random(0, imglist.length - 1)]}`))
        }
        msg = msg.replace("#", "")
        let networks = new this.networks({ url: `${aida.url}${encodeURI(msg)}` })
        let data = await networks.getData()
        if (!data || data?.status == 504) {
            return this.reply(this.segment.image(`${this.Path.qianyuPath}resources/img/noresult/${imglist[lodash.random(0, imglist.length - 1)]}`))
        }
        if (Array.isArray(aida.data)) {
            if (networks.type == 'text') {
                data = JSON.parse(data)
            }
            aida.data.forEach(item => {
                data = data[item]
            })
        }
        data = data.replace(/\\n/g, "\n")
        return await this.reply(`${data.replace(/菲菲|小思|小爱|思知|ChatGPT/g, botname ? botname : ai)}`)
    }


    async wenxin() {
        if (this.e.user_id != 1765629830) return false
        let pro = this.e.msg.replace("文心", "")
        let res = await this.getWenxinAi(pro)
        let msg = []
        if (res.text) {
            msg.push(res.text.replace(/<br>/g, "\n").replace(/<img[^>]*\bsrc\s*=\s*['"]([^'"]*)['"][^>]*>/g, "").trim())
        }
        if (res.image) {
            msg.push(this.segment.image(res.image))
        }
        this.reply(msg)
    }


}

