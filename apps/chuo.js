import Base from '../model/base/Base.js'
import lodash from 'lodash'
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
        if (!this.Cfg.isOpen) return false
        let groupNumber = this.e.group_id;
        /** 判断戳的是不是自己 */
        if (e.target_id == e.self_id) {
            let imgData = this.Data.getDataJson(`/groupface/${groupNumber}-face`) || [];
            if (imgData.length == 0) {
                return this.reply("还没有在该群学习过表情包");
            } else {
                let imageUrl = imgData[lodash.random(0, imgData.length - 1)]
                this.e.reply(imageUrl.content);
            }
        }
    }
}