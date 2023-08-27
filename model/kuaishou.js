import Base from "./base/Base.js";
export default class kuaishou extends Base {
    constructor(data) {
        super(data)
        this.headers = {
            referer: "www.kuaishou.com",
            cookie: 'did=web_aebc21c90cd01acbe31d9179c9b78952; didv=1692807076659; kpf=PC_WEB; kpn=KUAISHOU_VISION; clientid=3'
        }
    }

    async getKuaishouVideo(url) {
        let res = await new this.networks({ url: 'https://www.kuaishou.com/f/X-nfcdq3Mku41gm' }).getfetch()
        url = res.url
        let data = await new this.networks({
            url: url,
            headers: this.headers, type: "text"
        }).getData()
        if (!data) return false
        let html = data
        let videourl = html.match(/https:\\u002F\\u002Fv2\.kwaicdn\.com\\u002Fksc2.*ss=vp\"/g)
        return videourl[0].split('","')[0].replace(/\\u002F/g, "/")
    }
}




