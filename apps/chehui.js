import Base from '../model/base/Base.js'
export default class chehui extends Base {
    constructor() {
        super({
            name: 'chehui',
            priority: 50,
            rule: [
                {
                    reg: '#撤回',
                    fnc: 'che'
                },
            ],
        })
    }

    async che(e) {
        if (!e.source) {
            return e.reply("不存在消息源！")
        }
        if (e.source.user_id == e.self_id) {
            let msgid = (await e.group.getChatHistory(e.source.seq, 1))[0].message_id
            let res = await e.group.recallMsg(msgid)
            if (!res) {
                this.reply("伦家不是管理员，不能撤回超过2分钟的消息呢~")
            }
        }

    }
}