import base from './base/Base.js'
import ffmpeg from '../component/ffmpeg/ffmpeg.js'
import BApi from './bilibili/BApi.js'
import Video from './video.js'
let video = new Video({ name: 'video' })
export default class bilibili extends base {
    constructor(data) {
        super(data)
    }

    get ck() {
        console.log(this.Cfg.cookie);
        return this.Cfg.cookie
    }

    set ck(cookie) {
        this.Cfg = { key: 'cookie', value: cookie }
    }

    setBilibiliData(data, bv) {
        video.setBiliBiliData(data, bv)
    }

    deleteBilibiliData(md5) {
        return video.deleteBiliBiliData(md5)
    }

    setGroupBilibiliData(group_id, data) {
        video.setBiliBiliDataByGroup(group_id, data)
    }

    getGroupBilibiliData(group_id) {
        return video.getBiliBiliDataByGroup(group_id)
    }



    getBilibiliData() {
        return video.getBiliListData()
    }

    getVideoAllList() {
        return Object.keys(this.getBilibiliData())
    }

    getVideo(bv) {
        return this.getBilibiliData()[bv]
    }

    compositeBiliVideo(videoPath, audioPath, resultPath, suc, faith) {
        ffmpeg.VideoComposite(videoPath, audioPath, resultPath, suc, faith)
    }

    async CheckFfmpegEnv() {
        return await ffmpeg.checkEnv()
    }

    async getVideoInfo(bv) {
        return await BApi.videoInfo(bv)
    }

    async getVideoUrlPlus(bv, ck = '') {
        return await BApi.videoData(bv, ck || this.ck)
    }

    async getVideoUrl(bv) {
        return await BApi.videoDataByCid(bv)
    }

    async getQnVideo(qn, bv, ck = '') {
        let { accept_quality, videoList, audio } = await this.getVideoUrlPlus(bv, ck)
        let videoUrl = ''
        if (accept_quality[0] == qn || qn > accept_quality[0]) {
            qn = accept_quality[0]
        }
        else if (!accept_quality.includes(qn) && accept_quality[0] > 80 && qn == 116) {
            qn = 112
        } else if (!accept_quality.includes(qn) && accept_quality[0] > 80 && qn == 112) {
            qn = 80
        }
        videoUrl = videoList.find(item => item.qn == qn).url
        return { videoUrl: videoUrl, audio }
    }

    async downBilibiliVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }

}

