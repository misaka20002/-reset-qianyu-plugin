import Base from "./base/Base.js";
export default class kuaishou extends Base {
    constructor(data) {
        super(data)

    }

    get ck() {
        return this.Cfg.cookie
    }

    set ck(cookie) {
        this.Cfg = { key: 'cookie', value: cookie }
    }

    async getKuaishouVideo(url) {
        console.log(this.ck);
        let headers = {
            referer: "www.kuaishou.com",
            cookie: this.ck || 'did=web_aebc21c90cd01acbe31d9179c9b78952; didv=1692807076659; kpf=PC_WEB; kpn=KUAISHOU_VISION; clientid=3',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.62"
        }
        let res = await new this.networks({ url: 'https://www.kuaishou.com/f/X-nfcdq3Mku41gm' }).getfetch()
        url = res.url
        let data = await new this.networks({
            url: url,
            headers: headers, type: "text"
        }).getData()
        let html = data
        let videourl = html.match(/https:\\u002F\\u002Fv2\.kwaicdn\.com\\u002Fksc2.*ss=vp\"/g)
        if (!videourl) return false
        return videourl[0].split('","')[0].replace(/\\u002F/g, "/")
    }

    async downVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }
}




