import Base from "./base/Base.js";
import * as xbogus from './douyin/xbogus.cjs'
export default class douyin extends Base {
    constructor(data) {
        super(data)
        this.headers = {
            "accept-encoding": "gzip, deflate, br",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203"
        }
    }

    get ck() {
        return this.Cfg.ck
    }

    set ck(cookie) {
        this.Cfg = { key: 'ck', value: cookie }
    }

    async getDouyinVideo(id = '', type = 'video') {
        let headers = { "cookie": this.ck || '', ...this.headers, referer: "https://www.douyin.com/" }
        let url = `https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=${id}&pc_client_type=1&version_code=190500&version_name=19.5.0&cookie_enabled=true&screen_width=1536&screen_height=864&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=115.0&browser_online=true&engine_name=Blink&engine_version=115.0&os_name=Windows&os_version=10&cpu_core_num=8&device_memory=&platform=PC&webid=7221112461945194044&msToken=3ai6kSEr0OLFsxD5cGDIt5X3Mtzo25eOBe3Nr--qEWSx_CupXmkvEmrirBcvJVtxbPLi1xcRpVbLZ6XchZo6c4HWUF5VRNy4FD7N2HGP-jv3cJc_wwIJ`
        let data = await new this.networks({
            url: `${url}&X-Bogus=${this.getParm(url)}`,
            headers, type: "json"
        }).getData()
        let resulturl, info;
        if (!data.aweme_detail) return false
        info = {
            nickname: data.aweme_detail.author.nickname,
            short_id: data.aweme_detail.author.short_id,
            desc: data.aweme_detail.desc,
            datasize: ''
        }
        let datasize = data.aweme_detail.video.play_addr.data_size
        info.datasize = datasize
        resulturl = data.aweme_detail.video.play_addr.url_list[0]
        if (datasize > 1024 * 1024 * 100) {
            resulturl = data.aweme_detail.video.play_addr_265.url_list[0]
            info.datasize = data.aweme_detail.video.play_addr_265.data_size
        }
        if (resulturl)
            if (type == 'note') {
                resulturl = data.aweme_detail.images.map(item => {
                    return item.url_list[0]
                });
            }
        return { resulturl, info }
    }


    async getDouyinId(url = '') {
        let request = new this.networks({ url, type: "text" })
        url = await request.redirectUrl()
        let reg = /(video|note)\/\d+/g
        let id = url.match(reg)[0].split("/")[1]
        return { type: url.match(reg)[0].split("/")[0], id: id }
    }

    async downVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }

    getParm(url) {
        //方法来源：https://gitee.com/kyrzy0416/rconsole-plugin 
        return xbogus.sign(
            new URLSearchParams(new URL(url).search).toString(),
            this.headers["user-agent"],
        );
    }

}



