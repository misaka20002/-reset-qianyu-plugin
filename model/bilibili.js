import base from './base/Base.js'
import ffmpeg from '../component/ffmpeg/ffmpeg.js'
import BApi from './bilibili/BApi.js'
import Video from './video.js'
let video = new Video({ name: 'video' })
export default class bilibili extends base {
    constructor(data) {
        super(data)
        this.File.CreatDir('data/bilibili')
    }

    get ck() {
        return this.Cfg.cookie
    }

    set ck(cookie) {
        this.Cfg = { key: 'cookie', value: cookie }
    }

    setBilibiliData(data, bv) {
        video.setBiliBiliData(data, bv)
    }

    setBilibiLiveData(data) {
        let livedata = this.getBilibiLiveData()
        if (livedata[data.room_id]) {
            livedata[data.room_id] = {
                room_id: data.room_id,
            }
            if (livedata[data.room_id].group != null && Object.keys(livedata[data.room_id].group).includes(data.group_id)) {
                livedata[data.room_id].group[data.group_id] = [...livedata[data.room_id].group[data.group_id], data.user_id]
            } else {
                livedata[data.room_id].group = {}
                livedata[data.room_id].group[data.group_id] = [data.user_id]
            }
        } else {
            livedata[data.room_id] = {
                room_id: data.room_id,
                group: {}
            }
            livedata[data.room_id].group[data.group_id] = [data.user_id]
        }
        this.Data.setDataJson(livedata, 'bilibili/live')
    }

    getBilibiLiveData() {
        return this.Data.getDataJson('bilibili/live') || {}
    }

    delBilibiLiveData(data) {
        let livedata = this.getBilibiLiveData()
        let groupList = Object.keys(livedata[data.room_id].group)
        let group = livedata[data.room_id].group
        if (groupList.length == 1 && group[groupList[0]].length == 1 && group[groupList[0]][0] === data.user_id) {
            delete livedata[data.room_id]
            groupList = []
        }
        for (let r of groupList) {
            if (group[r].length == 1 && group[r][0] === data.user_id) {
                delete livedata[data.room_id].group[r]
            } else {
                livedata[data.room_id].group[r] = group[r].filter(item => item !== data.user_id)
            }
        }
        this.Data.setDataJson(livedata, 'bilibili/live')
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

    async getRoomInfo(room_id) {
        return await BApi.getRoomInfo(room_id, this.ck)
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
