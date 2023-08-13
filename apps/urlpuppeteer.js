import Video from '../model/video.js'
import puppeteer from '../component/puppeteer/puppeteer.js'
export default class urlpuppeteer extends Video {
    constructor(e) {
        super({
            name: 'urlpuppeteer',
            priority: 200,
            rule: [
                {
                    reg: '',
                    fnc: 'jxtu',
                }
            ],
        })
        this.e = e
    }

    async jxtu(e) {
        let url = e.url
        if (!url || !this.Cfg.isOpen) {
            return false
        }
        this.reply(await puppeteer.urlScreenshot(url))
    }

}
