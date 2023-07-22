import { segment } from 'icqq'
import Base from '../model/base/Base.js'
export default class hongb extends Base {
    constructor() {
        super({
            name: 'hongbao',
            priority: 50,
            rule: [
                {
                    reg: '#发个红包',
                    fnc: 'bao'
                },
            ],
        })
    }

    async bao(e) {
        let json = this.File.getFileDataToJson('/resources/json/QQjson.json')['QQ红包']
        e.reply(segment.json(JSON.stringify(json)))
    }
}