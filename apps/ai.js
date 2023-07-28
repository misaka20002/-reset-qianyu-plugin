import { geturldata, filemage } from '../../../utils/index.js'
import Cfg from '../../../../../lib/config/config.js'
import lodash from 'lodash'

const path = process.cwd() + '/plugins/qianyu-plugin/'

let file = new filemage()
let cfg = {
    isPrivate: true,
    isGroup: true,
    probability: 100,
    ai: "思知"
}
let gcfg = {
    isopen: false,
    gprobability: 40,
    gai: '思知'
}

let apps = {
    id: 'ai',
    name: '人工智障ai',
    desc: '人工智障ai',
    event: 'message',
    priority: 100000,
    rule: []
}

apps.rule.push({
    reg: '',
    desc: '智障ai',
    fnc: 'ffai',
    fuc: ffai
})


async function ffai(e) {
    let config = JSON.parse(await redis.get('qianyu:ai:config')) || cfg
    let groupconfig = JSON.parse(await redis.get(`qianyu:ai:config:${e.group_id}`)) || gcfg
    let radom = lodash.random(1, 100)
    if (e.isGroup) {
        let gcfg = Cfg.getGroup(e.group_id)
        let gqz = gcfg.botAlias
        let gz = gqz.join("|")
        let reg = new RegExp(`^${gz}`)
        if (e.user_id == e.self_id) return
        if (config.isGroup == false) return ""
        if (e.atBot || reg.test(e.raw_message)) {
            return await getai(e, config.ai, groupconfig.gai, this)
        }
        if (groupconfig.isopen) {
            if (radom <= groupconfig.gprobability) {
                await getai(e, config.ai, groupconfig.gai, this)
            }
        }

    }
    if (e.isPrivate) {
        if (config.isPrivate == false) return ""
        if (radom <= config.probability) {
            await getai(e, config.ai, undefined, this)
        }
    }
}

//ai
async function getai(e, ai, gconfig, that) {
    if (e.isPrivate) {
        await choieai(e.msg, ai, that)
    }
    if (e.isGroup) {
        if (!gconfig) {
            gconfig = ai
        }
        await choieai(e.msg, gconfig, that)
    }
}


async function choieai(msg, ai, that) {
    let aidata = await file.getyamlJson("resources/data/api/ai")
    let botname = await redis.get(`qianyu:ai:botname`)
    let ailist = aidata.ailist
    let aida = ailist.find(list => list.name == ai)
    if (!aida) return
    if (!msg) {
        let imglist = file.getfilelist('resources/img/noresult/')
        console.log(imglist);
        return that.reply(segment.image(`${path}resources/img/noresult/${imglist[lodash.random(0, imglist.length - 1)]}`))
    }
    await geturldata({ url: `${aida.url}${encodeURI(msg)}`, data: aida.data }, (res) => {
        let respose;
        if (ai == '菲菲') {
            let msglist = res.data.split("━━━━━━━━━")
            respose = msglist[1].replace(/\n/g, "")
        } else {
            respose = res.data
        }
        that.reply(`${respose.replace(/小思|菲菲|小爱|思知/g, botname ? botname : ai)}`)
    })

}


export default apps