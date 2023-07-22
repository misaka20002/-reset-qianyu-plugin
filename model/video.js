import Base from "./base/Base.js";

export default class video extends Base {
    constructor(data) {
        super(data)
        this.File.CreatDir('data')
        this.File.CreatDir('data/video')
        this.File.CreatDir('resources')
        this.File.CreatDir('resources/video')
    }

    //获取视频列表
    getVideoListData(name) {
        return this.Data.getDataJson(name)
    }

    getVideoDataByName(name) {
        return this.getVideoListData(`video/${name}`)
    }

    setVideoDataByName(data, name) {
        let videoData = this.getVideoDataByName(name) || {}
        if (!videoData[data.md5]) {
            videoData[data.md5] = data
        } else {
            return false
        }
        if (Object.keys(data).length == 0) {
            videoData = {}
        }
        this.Data.setDataJson(videoData, `video/${name}`)
        return true
    }

    setBiliBiliData(data, key) {
        let videoData = this.getBiliListData()
        if (!videoData[key]) {
            videoData[key] = data
        }
        this.Data.setDataJson(videoData, 'video/bilibilivideo')
    }

    deleteBiliBiliData(md5) {
        let videoData = this.getBiliListData()
        for (let b in videoData) {
            if (videoData[b].md5 == md5) {
                delete videoData[b]
                this.Data.setDataJson(videoData, 'video/bilibilivideo')
                return true
            }
        }
        return false
    }

    getBiliBiliDataByGroup(group_id) {
        let data = this.getVideoListData(`video/groupbilibilivideo`)
        if (group_id && data[group_id]) {
            return data[group_id]
        } else if (group_id && !data[group_id]) {
            return null
        }
        return data

    }

    setBiliBiliDataByGroup(group_id, data) {
        let videoData = this.getBiliBiliDataByGroup() || {}
        if (!videoData[group_id]) {
            videoData[group_id] = []
        }
        if (!videoData[group_id].some(item => item.bv == data.bv)) {
            videoData[group_id].push(data)//时间加bv号
        }
        this.Data.setDataJson(videoData, 'video/groupbilibilivideo')
    }


    //获取b站视频列表
    getBiliListData() {
        return this.getVideoListData('video/bilibilivideo')
    }

    async downVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }



}

