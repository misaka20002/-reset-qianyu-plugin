import networks from "../../utils/networks.js"
// import bilibili from "../bilibili.js"
class BApi {

    get ck() {
        return "buvid3=EFB65139-5FB7-94A5-0DF5-AC344A95923744753infoc; b_nut=1678831045; i-wanna-go-back=-1; _uuid=52C2A93D-103F5-F319-A3D5-C2CF732637A870805infoc; CURRENT_BLACKGAP=0; buvid4=796F88D2-858D-26E3-DCC9-8D132AC8029F21605-022121417-ma%2BngKRQCtThR5k8JstaYQ%3D%3D; b_ut=5; LIVE_BUVID=AUTO1216788443022689; CURRENT_FNVAL=4048; buvid_fp_plain=undefined; rpdid=0zbfVHhRW8|2sx2zM2C|y6U|3w1PCk3N; nostalgia_conf=-1; hit-dyn-v2=1; CURRENT_PID=16918660-cd5a-11ed-abed-d59bb1e08670; FEED_LIVE_VERSION=V8; home_feed_column=5; DedeUserID=19914630; DedeUserID__ckMd5=88f33016cfd1182b; SESSDATA=579d0947%2C1708404056%2C75eb9%2A81qoJHpvZIs4rNtzwYt6g3tdtZ1YMIiN6wUqEawmf3aWWgkppPt8F_8dPjwTm9A9C-pb9TqAAAHgA; bili_jct=a4b1a3f315e484fcdce733a05c2acdea; sid=7gr552fx; hit-new-style-dyn=1; fingerprint=665201a41a68462f408b10a5feed5130; bili_ticket=eyJhbGciOiJFUzM4NCIsImtpZCI6ImVjMDIiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE2OTMxMzg4ODAsImlhdCI6MTY5Mjg3OTY4MCwicGx0IjotMX0.Bj02Vg-xg13-MlAilo-znxWH9Mrr_rNby8Vv8ytejX0M59_8SP5W2Gujm8JoIiZ0et-En-IgKWttOGRrartqbUKQMmkhMzga0Dln76dFIbMZBqsFKVAS77PExY43X6_2; bili_ticket_expires=1693138880; header_theme_version=CLOSE; buvid_fp=665201a41a68462f408b10a5feed5130; bp_video_offset_19914630=833745549797621764; b_lsid=EE9742CA_18A2C773E60; browser_resolution=1868-976; PVID=11"
    }

    get headers() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.79',
        }
    }


    getUrlMap = (data = {}) => {
        let UrlMap = {
            //视频信息
            videoInfo: {
                url: `http://api.bilibili.com/x/web-interface/view?bvid=${data.bv}`
            },
            //视频数据
            videoData: {
                url: `https://www.bilibili.com/video/${data.bv}`,
                headers: { ...this.headers, referer: 'https://www.bilibili.com', cookie: data.ck || this.ck },
                type: 'text'
            },
            //低配画质不合成
            videoLow: {
                url: `https://api.bilibili.com/x/player/playurl?bvid=${data.bv}&cid=${data.cid}&qn=64`
            },
            //up直播间信息
            midRoom: {
                url: `https://api.live.bilibili.com/live_user/v1/Master/info?uid=${data.mid}`,
                headers: { Cookie: data.ck || this.ck },
                type: 'json'
            },
            //直播间信息
            liveRoomInfo: {
                url: `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${data.room_id}`,
                headers: { Cookie: data.ck || this.ck },
                type: 'json'
            },
            //动态列表
            dynamiclist: {
                url: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=&host_mid=${data.mid}&timezone_offset=-480&features=itemOpusStyle`,
                headers: { ...this.headers, Cookie: data.ck || this.ck },
                type: 'json'
            },
            //用户信息
            userInfo: {
                url: `https://api.bilibili.com/x/web-interface/card?mid=${data.mid}&photo=false`,
                headers: { ...this.headers, Cookie: data.ck || this.ck },
                type: 'json'
            },
            //专栏文章信息
            article: {
                url: `https://www.bilibili.com/read/${data.id}/?spm_id_from=333.999.list.card_opus.click`,
                headers: { ...this.headers, Cookie: data.ck || this.ck },
                type: 'text'
            },
            //分类搜索
            search: {
                url: `https://api.bilibili.com/x/web-interface/wbi/search/type?__refresh__=true&_extra=&order=${data.order}&context=&page=1&page_size=42&from_source=&from_spmid=333.337&platform=pc&highlight=1&single_column=0&keyword=${data.keyword}&qv_id=ZINfg344aj8e6MOSKXaaIcBPyKJsU07m&ad_resource=5654&source_tag=3&gaia_vtoken=&category_id=&search_type=${data.search_type}&dynamic_offset=36&w_rid=57354046d4011cae09e94c624e9dc9ba&wts=1678541433`,
                headers: { ...this.headers, Cookie: data.ck || this.ck, 'referer': 'https://www.bilibili.com/', },
                type: 'json'
            }

        }
        return UrlMap[data.type]
    }

    async videoInfo(bv) {
        let res = await new networks(this.getUrlMap({ type: 'videoInfo', bv: bv })).getData()
        let { bvid, cid, owner, pic, title, desc, ctime, stat, duration } = res.data
        return { bvid, cid, owner, pic, title, desc, ctime, stat, duration }
    }

    async videoData(bv, ck = '') {
        //默认最高画质
        //qn80（1080p）,64(720p),32(480p),16(360p),112(1080p+),116(1080p60),120(4k)
        let res = await new networks(this.getUrlMap({ type: 'videoData', bv: bv, ck: ck })).getData()
        let data = res.match(/<script>window\.__playinfo__=({.*})<\/script><script>/)?.[1]
        data = JSON.parse(data).data
        let videoList = []
        let { dash } = data
        let real_quality = []
        dash.video.filter((item, index) => {
            if (index === 0 || item.id !== videoList[videoList.length - 1].qn) {
                real_quality.push(item.id)
                videoList.push({ qn: item.id, url: item.baseUrl })
            }
        })
        return { accept_quality: real_quality, videoList: videoList, audio: dash.audio[0].baseUrl }
    }


    //低配不用合成(最高720P)
    async videoDataLow(bv) {
        let videoInfo = await this.videoInfo(bv)
        let res = await new networks(this.getUrlMap({ type: 'videoLow', bv: videoInfo.bvid, cid: videoInfo.cid })).getData()
        let url = res.data.durl[0].url || res.data.durl[0].backup_url[0]
        return { url: url }
    }



    async getRoomInfobyMid(mid, ck) {
        let res = await new networks(this.getUrlMap({ type: 'midRoom', mid: mid, ck: ck })).getData()
        if (res.code == 0) {
            return res.data
        }
    }

    async getRoomInfo(room_id, ck) {
        let res = await new networks(this.getUrlMap({ type: 'liveRoomInfo', room_id: room_id, ck: ck })).getData()
        if (res.code == 0) {
            let { uid, room_id, attention, area_name, online, description, live_status, user_cover, live_time, title } = res.data
            return { uid, room_id, area_name, attention, online, description, live_status, user_cover, live_time, title }
        }
    }

    async getdynamiclist(mid, ck) {
        let res = await new networks(this.getUrlMap({ type: 'dynamiclist', mid: mid, ck: ck })).getData()
        if (res.code == 0) {
            return res.data.items
        } else {
            return res
        }
    }

    async getuserinfo(mid, ck) {
        let res = await new networks(this.getUrlMap({ type: 'userInfo', mid: mid, ck: ck })).getData()
        if (res.code == 0) {
            let { name, sex, face, pendant } = res.data?.card
            return { name, sex, face, pendant }
        }
    }

    async getarticle(id, ck) {
        let res = await new networks(this.getUrlMap({ type: 'article', id: id, ck: ck })).getData()
        let data = res.match(/<script>window\.__INITIAL_STATE__=({.*})<\/script>/)?.[1]
        data = data.split('(function()')?.[0]?.replace(/;/g, "")
        return JSON.parse(data)
    }

    async getsearch(keyword, search_type, order, ck) {
        let res = await new networks(this.getUrlMap({ type: 'search', keyword: keyword, order: order, search_type: search_type, ck: ck })).getData()
        if (res.code == 0) {
            return res.data.result
        }
    }
}

export default new BApi()
// console.log(await new BApi().getdynamiclist('401742377', new bilibili({ name: 'bilibili' }).ck))