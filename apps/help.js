import Base from '../model/base/Base.js'
import { changelogs } from '../model/version.js'
export default class help extends Base {
    constructor() {
        super({
            name: 'help',
            priority: 50,
            rule: [
                {
                    reg: '^(#|)千羽帮助$',
                    fnc: 'help'
                },
                {
                    reg: '^(#|)千羽版本$',
                    fnc: 'version'
                }
            ]
        })
    }

    async help(e) {
        let data = this.Cfg
        if (!e.isMaster) {
            data.helplist.splice(data.helplist.length - 1, 1)
        }
        return this.reply(await this.render('help', data))
    }

    async version(e) {
        return this.reply(await this.render('version', { changelogs }))
    }
}
