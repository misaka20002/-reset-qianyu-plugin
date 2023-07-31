import Base from '../model/base/Base.js'
export default class chuo extends Base {
    constructor() {
        super({
            name: 'chuo',
            priority: 50,
            event: 'notice.group.poke',
            rule: [
                {
                    reg: '',
                    fnc: 'poke'
                },
            ],
        })
    }

    async poke(e) {

    }
}