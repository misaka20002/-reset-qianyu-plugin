import Base from '../model/base/Base.js'
export default class card extends Base {
    constructor() {
        super({
            name: 'card',
            priority: 50,
            rule: [
                {
                    reg: '^得意$',
                    fnc: 'datu'
                },
            ],
        })
    }

    async datu() {
        let json = this.File.getFileDataToJson('/resources/json/QQjson.json')['得意']
        this.e.reply(this.segment.json(JSON.stringify(json)))
    }
}