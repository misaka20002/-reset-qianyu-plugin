import Base from '../model/base/Base.js'
export default class grouptitle extends Base {
    constructor() {
        super({
            name: 'settitle',
            priority: 50,
            rule: [
                {
                    reg: '#设置群头衔',
                    fnc: 'sett'
                },
            ],
        })
    }

    async sett(e) {
        if (!e.group.is_owner) {
            return e.reply("不是群主做不到啦！")
        }
        let msg = e.msg.replace("#设置群头衔", "")
        await e.group.setTitle(e.user_id, msg)


    }
}