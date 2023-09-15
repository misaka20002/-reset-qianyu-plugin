import base from './base/Base.js'
import ffmpeg from '../component/ffmpeg/ffmpeg.js'
import BApi from './bilibili/BApi.js'
import Video from './video.js'
import moment from 'moment'
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

    setBilibiUpPushData(group_id, data) {
        this.Data.setDataJson(data, `bilibili/${group_id}`) || {}
    }

    getBilibiUpPushData(group_id) {
        return this.Data.getDataJson(`bilibili/${group_id}`) || {}
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

    async getRoomInfobymid(mid) {
        let { roomid } = await BApi.getRoomInfobyMid(mid, this.ck)
        return await this.getRoomInfo(roomid)
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

    async getUserInfo(mid) {
        return await BApi.getuserinfo(mid, this.ck)
    }

    async getdynamiclistAllbymid(mid, index) {
        return await BApi.getdynamiclist(mid, this.ck)
    }

    async getBilibiliUpBymedal(str) {
        let medalData = this.File.getFileDataToJson('resources/medal.json')
        return medalData.find(item => item[str])

    }

    async getUpdateDynamic(mid, index) {
        let datalist = await this.getdynamiclistAllbymid(mid)
        if (!datalist) {
            return {
                code: '500',
                message: "未知错误！"
            }
        }
        if (datalist.code) {
            return datalist
        }
        let data;
        if (datalist.length == 0) {
            return {
                code: '0',
                message: 'up主还没有发布过动态！'
            }
        }

        let datalist2 = datalist.filter(item => item.type !== "DYNAMIC_TYPE_LIVE_RCMD")

        if (parseInt(moment().diff(datalist2[0]?.modules?.module_author?.pub_ts * 1000 || 0, 'minute', true)) < 10) {
            data = datalist2[0]
        } else if (parseInt(moment().diff(datalist2[1]?.modules?.module_author?.pub_ts * 1000 || 0, 'minute', true)) < 10) {
            data = datalist2[1]
        }
        if (index != undefined) {
            if (datalist[0]?.modules?.module_tag?.text == "置顶" && datalist[0]?.modules?.module_author?.pub_ts < datalist[1]?.modules?.module_author?.pub_ts) {
                data = datalist[1]
            } else {
                data = datalist[0]
            }
        }
        if (!data) {
            return false
        }

        return { ...this.dealDynamicData(data), datalist }

    }

    dealDynamicData(data) {
        let text = '', imglist = '', video, orig = '', liveInfo, comment = '', erm, id;
        let author = {
            nickname: data.modules.module_author.name,
            img: data.modules.module_author.face,
            pendantImg: data.modules.module_author?.pendant.image
        }
        let { desc, major } = data.modules.module_dynamic
        if (major?.live_rcmd) {
            let { live_play_info } = JSON.parse(major.live_rcmd.content)
            liveInfo = {
                cover: live_play_info.cover,
                title: live_play_info.title,
                area_name: live_play_info.area_name,
                watched_show: live_play_info.watched_show.text_large,
                liveurl: "https:" + live_play_info.link,
                live_id: live_play_info.live_id
            }
        }
        erm = `https://www.bilibili.com/opus/${data.id_str}`
        id = data.id_str
        if (desc) {
            text = desc.rich_text_nodes.map(item => {
                if (item.type == 'RICH_TEXT_NODE_TYPE_EMOJI') {
                    return `<img src='${item.emoji.icon_url}' class='face'/>`
                }
                if (item.type == "RICH_TEXT_NODE_TYPE_LOTTERY" || item.type == "RICH_TEXT_NODE_TYPE_TOPIC" || item.type == "RICH_TEXT_NODE_TYPE_AT") {
                    return `<span style="color:#178bcf">${item.orig_text}</span>`
                }
                return item.orig_text.replace(/\n/g, "<br>")
            })?.join('') || ''
        }
        if (major?.draw) {
            imglist = major.draw.items.map(item => {
                return item.src
            })
        }
        if (major?.archive) {
            video = {}
            video.img = major.archive.cover
            video.title = major.archive.title
            video.cover = major.archive.cover
            video.bvid = major.archive.bvid
            video.stat = major.archive.stat
            video.url = "https:" + major.archive.jump_url
            video.desc = major.archive.desc
            video.duration = major.archive.duration_text
            video.comment = data.modules.module_interaction ? {
                user: data.modules.module_interaction.items[0].desc.rich_text_nodes[0].text,
                content: data.modules.module_interaction.items[0].desc.rich_text_nodes[1].text,
            } : ""
            erm = video.url
        }
        let interaction = data.modules.module_interaction || ''
        if (interaction) {
            comment = {
                user: interaction.items[0].desc.rich_text_nodes[0].text,
                content: interaction.items[0].desc.rich_text_nodes[1].text,
            }
        }
        if (major?.opus) {
            let richnodes = major.opus?.summary?.rich_text_nodes
            text = richnodes.map(item => {
                if (item.type == 'RICH_TEXT_NODE_TYPE_EMOJI') {
                    return `<img src='${item.emoji.icon_url}' class='face'/>`
                }
                if (item.type == "RICH_TEXT_NODE_TYPE_LOTTERY" || item.type == "RICH_TEXT_NODE_TYPE_TOPIC" || item.type == "RICH_TEXT_NODE_TYPE_AT") {
                    return `<span style="color:#178bcf">${item.orig_text}</span>`
                }
                return item.orig_text.replace(/\n/g, "<br>")
            })?.join('') || ''
            if (major.opus?.pics) {
                imglist = major.opus?.pics.map(item => {
                    return item.url
                })
            }
        }

        if (data.orig) {
            orig = {}
            let odata = data.orig.modules
            orig.face = odata.module_author.face
            orig.name = odata.module_author.name
            orig.text = []
            orig.text = odata.module_dynamic.desc?.rich_text_nodes.map(item => {
                if (item.type == 'RICH_TEXT_NODE_TYPE_EMOJI') {
                    return `<img src='${item.emoji.icon_url}' class='face'/>`
                }
                if (item.type == "RICH_TEXT_NODE_TYPE_LOTTERY" || item.type == "RICH_TEXT_NODE_TYPE_TOPIC" || item.type == "RICH_TEXT_NODE_TYPE_AT") {
                    return `<span style="color:#178bcf">${item.orig_text}</span>`
                }
                return item.orig_text.replace(/\n/g, "<br>")
            }) || ''
            orig.text = orig.text ? orig.text.join('') : ""
            orig.imglist = odata.module_dynamic.major?.draw?.items.map(item => {
                return item.src
            }) || ''
            if (odata.module_dynamic.major?.archive) {
                orig.video = {}
                let { archive } = odata.module_dynamic.major
                orig.video.img = archive.cover
                orig.video.title = archive.title
                orig.video.cover = archive.cover
                orig.video.bvid = archive.bvid
                orig.video.stat = archive.stat
                orig.video.url = "https:" + archive.jump_url
                orig.video.desc = archive.desc
                orig.video.duration = archive.duration_text
            }
            if (odata.module_dynamic.major?.live) {
                let live = odata.module_dynamic.major.live
                orig.live = {}
                let live_play_info = live
                orig.live = {
                    cover: live_play_info.cover,
                    title: live_play_info.title,
                    area_name: live_play_info.desc_first,
                    watched_show: live_play_info.desc_second
                }
            }
            if (odata.module_dynamic.major?.opus) {
                let richnodes = odata.module_dynamic.major.opus?.summary?.rich_text_nodes
                orig.text = richnodes.map(item => {
                    if (item.type == 'RICH_TEXT_NODE_TYPE_EMOJI') {
                        return `<img src='${item.emoji.icon_url}' class='face'/>`
                    }
                    if (item.type == "RICH_TEXT_NODE_TYPE_LOTTERY" || item.type == "RICH_TEXT_NODE_TYPE_TOPIC" || item.type == "RICH_TEXT_NODE_TYPE_AT") {
                        return `<span style="color:#178bcf">${item.orig_text}</span>`
                    }
                    return item.orig_text.replace(/\n/g, "<br>")
                })?.join('') || ''
                if (odata.module_dynamic.major.opus?.pics) {
                    orig.imglist = odata.module_dynamic.major.opus?.pics.map(item => {
                        return item.url
                    })
                }
            }

        }
        const typeMap = {
            DYNAMIC_TYPE_AV: "视频",
            DYNAMIC_TYPE_WORD: "图文",
            DYNAMIC_TYPE_DRAW: "图文",
            DYNAMIC_TYPE_ARTICLE: "文章",
            DYNAMIC_TYPE_FORWARD: "转发",
            DYNAMIC_TYPE_LIVE_RCMD: "直播",
        };
        let type = typeMap[data.type]

        return {
            id, type, video, comment, text, imglist, author, erm, liveInfo, orig, date: moment(data.modules.module_author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
        }
    }
}

