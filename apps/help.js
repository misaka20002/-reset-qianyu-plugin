import lodash from 'lodash'
import Base from '../model/base/Base.js'

export default class help extends Base {
    constructor() {
        super({
            name: 'help',
            priority: 50,
            rule: [
                {
                    reg: '(#|)千羽帮助',
                    fnc: 'help'
                }
            ]
        })
    }

    async help(e) {
        let helplist = JSON.parse(await redis.get('qianyu:helplist')) || []
        let helpImgPath = '/resources/html/help/help.jpg'
        let data = this.Cfg
        if (!e.isMaster) {
            data.splice(data.helplist.length - 1, 1)
        }
        if (!lodash.isEqual(data.helplist, helplist)) {
            await redis.set("qianyu:helplist", JSON.stringify(data.helplist))
            data.path = this.Path.qianyuPath + helpImgPath
        } else {
            if (this.File.ExistsFile(helpImgPath)) {
                return this.reply(this.segment.image(this.Path.qianyuPath + helpImgPath))
            }
        }
        return this.reply(await this.render('help', data))
    }
}
