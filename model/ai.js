import Base from "./base/Base.js";
import { headless } from './ai/wenxinai.js'
export default class ai extends Base {
    constructor(data) {
        super(data)
    }

    get Ck() {
        return this.Cfg.Ck
    }

    async getWenxinAi(content) {
        return await headless({ cookie: this.Ck.wenxinCk, timeout: 1000 * 120, prompt: content, headless: 'new' })
    }

}




