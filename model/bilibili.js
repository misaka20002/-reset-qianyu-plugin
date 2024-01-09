import base from './base/Base.js'
import ffmpeg from '../component/ffmpeg/ffmpeg.js'
import BApi from './bilibili/BApi.js'
import Video from './video.js'
import moment from 'moment'
import lodash from 'lodash'
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

    get dynamicType() {
        return {
            DYNAMIC_TYPE_AV: "视频",
            DYNAMIC_TYPE_WORD: "文字",
            DYNAMIC_TYPE_DRAW: "图文",
            DYNAMIC_TYPE_ARTICLE: "专栏",
            DYNAMIC_TYPE_FORWARD: "转发",
            DYNAMIC_TYPE_LIVE_RCMD: "直播"
        }
    }

    setBilibiliData(data, bv) {
        video.setBiliBiliData(data, bv)
    }

    setBilibiUpPushData(group_id, data) {
        this.Data.setDataJson(data, `/bilibili/${group_id}`) || {}
    }

    //获取推送群列表
    getBilibiliGroupList() {
        return this.File.GetfileList('/data/bilibili').map(i => i.replace(".json", ""))
    }

    //获取推送up数据
    getBilibiUpPushData(group_id) {
        return this.Data.getDataJson(`/bilibili/${group_id}`) || {}
    }

    //删除推送up数据
    deleteBilibiliData(md5) {
        return video.deleteBiliBiliData(md5)
    }

    //设置群b站视频解析数据
    setGroupBilibiliData(group_id, data) {
        video.setBiliBiliDataByGroup(group_id, data)
    }

    //获取群b站视频解析数据
    getGroupBilibiliData(group_id) {
        return video.getBiliBiliDataByGroup(group_id)
    }

    //获取所有b站视频解析数据
    getBilibiliData() {
        return video.getBiliListData()
    }

    //获取所有b站视频列表
    getVideoAllList() {
        return Object.keys(this.getBilibiliData())
    }

    //根据bv号获取b站视频数据
    getVideo(bv) {
        return this.getBilibiliData()[bv]
    }

    //合成视频
    compositeBiliVideo(videoPath, audioPath, resultPath, suc, faith) {
        ffmpeg.VideoComposite(videoPath, audioPath, resultPath, suc, faith)
    }

    //获取b站直播间信息
    async getRoomInfo(room_id) {
        return await BApi.getRoomInfo(room_id, this.ck)
    }

    //获取up主直播间相关信息
    async getRoomInfobymid(mid) {
        let data = await BApi.getRoomInfobyMid(mid, this.ck)
        if (data) {
            return await this.getRoomInfo(data.room_id)
        }
    }

    //检查FFmpeg环境
    async CheckFfmpegEnv() {
        return await ffmpeg.checkEnv()
    }

    //获取视频信息
    async getVideoInfo(bv) {
        return await BApi.videoInfo(bv)
    }

    //获取视频地址
    async getVideoUrlPlus(bv, ck = '') {
        return await BApi.videoData(bv, ck || this.ck)
    }

    //获取视频地址（低质量不经过合成）
    async getVideoUrl(bv) {
        return await BApi.videoDataLow(bv)
    }

    //获取不同质量的视频列表
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
        videoUrl = videoList.find(item => item.qn == qn)?.url
        return { videoUrl: videoUrl, audio }
    }

    //下载b站视频
    async downBilibiliVideo(data, path, suc) {
        return await this.downfile.downVideo(data, path, suc)
    }

    //获取b站用户信息
    async getUserInfo(mid) {
        return await BApi.getuserinfo(mid, this.ck)
    }

    //获取用户动态列表
    async getdynamiclistAllbymid(mid) {
        return await BApi.getdynamiclist(mid, this.ck)
    }

    //获取文章信息
    async getArticle(cid) {
        return await BApi.getarticle(cid, this.ck)
    }


    //查询b站粉丝牌（未实装）
    async getBilibiliUpBymedal(str) {
        let medalData = this.File.getFileDataToJson('/resources/medal.json')
        return medalData.find(item => item[str])
    }

    async getSearchUser(name, num = 1, order = 'fans') {
        let data = await BApi.getsearch(name, 'bili_user', order, this.ck)
        if (data) {
            return num == 1 ? data[0] : data.slice(0, num)
        }
    }

    //获取用户动态(只取一条)(mode:update最新(10分钟)，first第一条（非置顶,有置顶不是最新跳过),Top置顶动态（非置顶动态不获取）)
    async getDynamic(mid, mode) {
        let dynamicList = await this.getdynamiclistAllbymid(mid)
        if (!dynamicList || dynamicList.code || !Array.isArray(dynamicList)) {
            return {
                code: dynamicList?.code || '500',
                message: dynamicList?.message || "未知错误！"
            }
        }
        //获取不到动态
        if (dynamicList.length == 0) {
            return {
                code: '0',
                message: 'up主还没有发布过动态！'
            }
        }
        //移除直播动态
        dynamicList = dynamicList.filter(item => item.type !== "DYNAMIC_TYPE_LIVE_RCMD")
        let dynamic;
        switch (mode) {
            case 'update'://仅取最近10分钟的动态
                if (parseInt(moment().diff(dynamicList[0]?.modules?.module_author?.pub_ts * 1000 || 0, 'minute', true)) < 10) {
                    dynamic = dynamicList[0]
                } else if (parseInt(moment().diff(dynamicList[1]?.modules?.module_author?.pub_ts * 1000 || 0, 'minute', true)) < 10) {
                    //说明第一条为置顶并且在10分钟之前
                    dynamic = dynamicList[1]
                }
                break;
            case 'first':
                //只取第一条动态,规避置顶
                if (dynamicList[0]?.modules?.module_tag?.text == "置顶" && dynamicList[0]?.modules?.module_author?.pub_ts < dynamicList[1]?.modules?.module_author?.pub_ts) {
                    dynamic = dynamicList[1]
                } else {
                    dynamic = dynamicList[0]
                }
                break;
            case 'top':
                //只取置顶
                if (dynamicList[0]?.modules?.module_tag?.text == "置顶") {
                    dynamic = dynamicList[0]
                }
                break;
        }
        //判断是否是文章动态
        let cid;
        if (dynamic?.type == "DYNAMIC_TYPE_ARTICLE") {
            let ulist = dynamic?.modules?.module_dynamic?.major?.opus?.jump_url.split('/')
            cid = ulist[ulist.length - 2]
        }
        if (dynamic) {
            dynamic = this.dealDynamicData(dynamic)
        }
        if (cid) {
            dynamic.article = await this.getArticle(cid)
            dynamic.article.readInfo.content = dynamic.article?.readInfo?.content.replace(/<img data-src="/g, '<img src="https:')
        }
        return dynamic
    }

    //获取置顶动态
    async getTopDynamic(mid) {
        let dynamic = await this.getDynamic(mid, 'top')
        if (dynamic?.code) {
            return {
                code: dynamic?.code || '500',
                message: dynamic?.message || "未知错误！"
            }
        }
        if (!dynamic) {
            return {
                code: '0',
                message: '暂无置顶动态！'
            }

        }
        return dynamic
    }

    //获取最新动态信息(10分钟以内)
    async getUpdateDynamic(mid) {
        let dynamic = await this.getDynamic(mid, 'update')
        if (dynamic?.code) {
            return {
                code: dynamic?.code || '500',
                message: dynamic?.message || "未知错误！"
            }
        }
        if (!dynamic) {
            return {
                code: '0',
                message: '暂无最新动态！'
            }
        }
        return dynamic
    }

    //获取up主第一条动态
    async getFirstDynamic(mid) {
        let dynamic = await this.getDynamic(mid, 'first')
        if (dynamic?.code) {
            return {
                code: dynamicList?.code || '500',
                message: dynamicList?.message || "未知错误！"
            }
        }
        return dynamic
    }

    //处理动态数据
    dealDynamicData(data) {
        let { desc, major } = data.modules.module_dynamic
        let type = this.dynamicType[data.type]
        let text = '', imglist = '', video, orig = '', liveInfo, comment = '', erm, id;
        let author = {
            nickname: data.modules.module_author.name,//昵称
            img: data.modules.module_author.face,//头像
            pendantImg: data.modules.module_author?.pendant.image//头像框
        }
        erm = `https://www.bilibili.com/opus/${data.id_str}`//二维码链接
        id = data.id_str//动态id
        //是否是直播动态
        if (major?.live_rcmd) {
            let { live_play_info } = JSON.parse(major.live_rcmd.content)
            liveInfo = {
                cover: live_play_info.cover,//直播间封面
                title: live_play_info.title,//直播间标题
                area_name: live_play_info.area_name,//直播间分区
                watched_show: live_play_info.watched_show.text_large,//多少人看过
                liveurl: "https:" + live_play_info.link,//直播间地址
                live_id: live_play_info.live_id//直播间id
            }
        }
        //描述
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
        //图片列表
        if (major?.draw) {
            imglist = major.draw.items.map(item => {
                return item.src
            })
        }
        //档案（视频）
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
        //动态相关
        if (interaction) {
            comment = {
                user: interaction.items[0].desc.rich_text_nodes[0].text,
                content: interaction.items[0].desc.rich_text_nodes[1].text,
            }
        }
        //desc为空时描述在这
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
        //转发动态来源
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
                if (item.orig_text === '互动抽奖') {
                    type = "抽奖"
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
                    if (item.orig_text === '互动抽奖') {
                        type = "抽奖"
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
        return {
            id, type, video, comment, text, imglist, author, erm, liveInfo, orig, date: moment(data.modules.module_author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
        }
    }

    //获取用户的某一类型动态
    async getDynamicByType(mid, type = '图文', mode = 'all') {
        let dynamicType = Object.keys(this.dynamicType).find(item => this.dynamicType[item] == type)
        let dynamicList = await this.getdynamiclistAllbymid(mid)
        if (!dynamicList || dynamicList.code) {
            return {
                code: dynamicList?.code || '500',
                message: dynamicList?.message || "未知错误！"
            }
        }
        dynamicList = dynamicList.filter(item => item.type == dynamicType)
        //获取不到动态
        if (dynamicList.length == 0) {
            return {
                code: '0',
                message: `暂无最新的${type}动态！`
            }
        }
        dynamicList = dynamicList.map(element => { return this.dealDynamicData(element) })
        dynamicList = lodash.orderBy(dynamicList, 'date', 'desc')
        return dynamicList[0]
    }
}
// let b = new bilibili({ name: 'bilibili' })
// console.log(await b.getBilibiliGroupList())
// console.log(await b.getFirstDynamic('401742377'));

