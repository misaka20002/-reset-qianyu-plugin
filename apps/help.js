import Base from '../model/base/Base.js'
import { changelogs } from '../model/version.js'
import lodash from 'lodash'
import YamlReader from '../utils/YamlReader.js'
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

        this.isCusHelp = false//是否自定义帮助
    }

    async init() {
        let data = this.Cfg
        let helplist = new YamlReader(`${this.Path.qianyuPath}config/default_config/help.config.yaml`).jsonData
        if (!this.isCusHelp && !lodash.isEqual(data.helplist, helplist)) {
            this.File.CopyFile('config/default_config/help.config.yaml', 'config/config/help.config.yaml')
            delete this.Config.Cfg['help']
        }
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
