import puppeteer from '../component/puppeteer/puppeteer.js'
import Base from '../model/base/Base.js'
export default class other extends Base {
    constructor(e) {
        super({
            name: 'other',
            priority: 8000,
            rule: [
                {
                    reg: '',
                    fnc: 'jxtu',
                    log: false
                },
                // {
                //     reg: '^#撤回',
                //     fnc: 'che',
                //     permission: 'master'
                // },
                // {
                //     reg: '^#取直链',
                //     fnc: 'zhilian'
                // }
            ]
        })
        this.e = e
    }

    /**网页截图 */
    async jxtu(e) {        
        if (!this.Cfg.isscreenshot) {
            return false
        } else {
            let url = e.url
            if (!url) return false
            else this.reply(await puppeteer.urlScreenshot(encodeURI(url)))
        }        
    }

    // async che(e) {
    //     if (!e.source) {
    //         return e.reply("不存在消息源！")
    //     }
    //     if (e.source.user_id == e.self_id) {
    //         let msgid = (await e.group.getChatHistory(e.source.seq, 1))[0].message_id
    //         let res = await e.group.recallMsg(msgid)
    //         if (!res) {
    //             this.reply("伦家不是管理员，不能撤回超过2分钟的消息呢~")
    //         }
    //     }
    // }

    // async zhilian(e) {
    //     if (!e.source) {
    //         return false
    //     }
    //     let m = (await e.group.getChatHistory(e.source.seq, 1))[0]
    //     console.log(m);
    //     let msg = m.message
    //     if (!msg) return false
    //     msg = msg.map(element => {
    //         if (element.type == 'image') {
    //             return element.url
    //         }
    //     });
    //     return this.reply("图片直链为：" + msg)


    // }
}