import puppeteer from '../component/puppeteer/puppeteer.js'
import Base from '../model/base/Base.js'
export default class other extends Base {
    constructor(e) {
        super({
            name: 'other',
            priority: 200,
            rule: [
                {
                    reg: '',
                    fnc: 'jxtu',
                    log: false
                }
            ]
        })
        this.e = e
    }

    async jxtu(e) {
        let url = e.url
        if (!url || !this.Cfg.isscreenshot) {
            return false
        }
        this.reply(await puppeteer.urlScreenshot(encodeURI(url)))
    }

}
