import networks from "../../utils/networks.js"
class BApi {

    async videoInfo(bv) {
        return new Promise(async (resolve, reject) => {
            new networks({ url: `http://api.bilibili.com/x/web-interface/view?bvid=${bv}` }).getData().then(res => {
                let { bvid, cid, owner, pic, title, desc, ctime, stat, duration } = res.data
                resolve({ bvid, cid, owner, pic, title, desc, ctime, stat, duration })
            })
        })
    }

    async videoData(bv, ck = '') {
        //默认最高画质
        //qn80（1080p）,64(720p),32(480p),16(360p),112(1080p+),116(1080p60),120(4k)
        return new Promise(async (resolve, reject) => {
            new networks({
                url: `https://www.bilibili.com/video/${bv}`, headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.79',
                    referer: 'https://www.bilibili.com',
                    cookie: ck
                },
                type: 'text'
            }).getData().then(res => {
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
                resolve({ accept_quality: real_quality, videoList: videoList, audio: dash.audio[0].baseUrl })
            })
        })

    }


    //低配不用合成(最高720P)
    async videoDataByCid(bv) {
        let videoInfo = await this.videoInfo(bv)
        return new Promise(async (resolve, reject) => {
            new networks({
                url: `https://api.bilibili.com/x/player/playurl?bvid=${videoInfo.bvid}&cid=${videoInfo.cid}&qn=64`
            }).getData().then(res => {
                let url = res.data.durl[0].url || res.data.durl[0].backup_url[0]
                resolve({ url: url })
            })
        })
    }

    async getRoomInfo(room_id, ck) {
        return new Promise(async (resolve, reject) => {
            new networks({
                url: `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${room_id}`, headers: {
                    Cooke: ck
                }, type: 'json'
            }).getData().then(res => {
                if (res.code == 0) {
                    let { uid, room_id, attention, online, description, live_status, user_cover, live_time, title } = res.data
                    resolve({ uid, room_id, attention, online, description, live_status, user_cover, live_time, title })
                } else {
                    resolve(res)
                }
            })
        })
    }

}

export default new BApi()
