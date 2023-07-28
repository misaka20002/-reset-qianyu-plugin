import Base from "./base/Base.js";
export default class douyin extends Base {
    constructor(data) {
        super(data)
        this.headers = {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.183"
        }
    }

    get ck() {
        return this.Cfg.ck
    }

    async getDouyinVideo(id = '') {
        let headers = { "cookie": this.ck, ...this.headers }
        let data = await new this.networks({
            url: `https://www.douyin.com/video/${id}`,
            headers, type: "text"
        }).getData()
        let json = data.match(/%22aweme(.*?)%2C%22comment/g)
        let str = decodeURIComponent(json[1]).replace(',"comment', "").split('"aweme":')
        data = JSON.parse(str[1])
        return "https://" + data?.detail?.video?.playApi
    }

    async getDouyinId(url = '') {
        let request = await new this.networks({ url, type: "text" })
        url = (await request.getfetch()).url
        console.log(url);
        let reg = /video\/(.*?)\/\?/g
        let id = url.match(reg)[0].split("/")[1]
        return id
    }

    async downVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }
}



