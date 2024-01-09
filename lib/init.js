import { ListenerLoader } from '../component/icqq/EventListener.js'
class qianyu {
    async init() {
        await new ListenerLoader().load(Bot)
    }
}


export default new qianyu()