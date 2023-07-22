export default class QQmessage {
    constructor(client) {
        this.client = client
    }

    sendMsg(msg, user_id, groud_id) {
        console.log(groud_id);
        if (groud_id) {
            this.client.sendGroupMsg(groud_id, msg)
        } else {
            this.client.sendPrivateMsg(user_id, msg)
        }
    }

}