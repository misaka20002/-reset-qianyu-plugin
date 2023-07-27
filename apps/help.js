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
        let data = this.Cfg
        if (!e.isMaster) {
            data.splice(data.helplist.length - 1, 1)
        }
        return this.reply(await this.render('help', data))
    }
}
