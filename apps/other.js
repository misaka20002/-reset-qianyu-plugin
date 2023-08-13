import Video from '../model/video.js'
import puppeteer from '../component/puppeteer/puppeteer.js'
export default class other extends Video {
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
        if (!url || !this.Cfg.screenshot) {
            return false
        }
        this.reply(await puppeteer.urlScreenshot(encodeURI(url)))
    }

}
