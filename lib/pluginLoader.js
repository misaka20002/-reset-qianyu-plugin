import chokidar from 'chokidar'
import Filemage from "../utils/Filemage.js"
import common from "../utils/common.js"
import util from 'node:util'
import fs from 'fs'
import { segment } from 'icqq'
import moment from 'moment'
import lodash from 'lodash'
import chalk from 'chalk'
import path from 'node:path'
import timer from '../utils/Timer.js'
let pluginName = 'reset-qianyu-plugin'
class pluginLoader {
    constructor() {
        this.apps = [] //插件功能列表
        this.priority = [] //任务队列
        this.watcher = {}
        this.task = [] //定时任务
        this.filemage = new Filemage('apps')
    }

    async getApps() {
        let files = this.filemage.GetfileList()
        for (let f of files) {
            if (this.filemage.isDirectory(f)) continue
            if (!f.endsWith('.js')) continue
            //加载js插件
            let apps = await import(`../apps/${f}`)
            if (!apps) continue
            for (let a in apps) {
                let plugin = new apps[a]()
                //启动init
                plugin.init && plugin.init()
                if (plugin.task) {
                    plugin.task.fnc = plugin[plugin.task.fnc]
                }
                this.priority.push({
                    name: plugin.name,
                    event: plugin.event,
                    class: apps[a],
                    key: `${f}`,
                    priority: plugin.priority,
                    task: plugin.task,
                })
            }
            /** 监听热更新 */
            this.watch('apps', f)
        }
        this.collectTimeTask()
        this.creatTask()
    }

    async deal(e) {
        let priority = []
        if (this.isYunzai()) {
            //是否只关心at
            await this.dealMsg(e)
            if (! await this.onlyReplyAt(e)) return
        }
        this.priority.forEach((v, index) => {
            let p;
            if (v?.class) {
                p = new v.class(e)
            }
            p.e = e
            priority.push(p)
        })

        priority = lodash.orderBy(priority, ['priority'], ['asc'])

        for (let plugin of priority) {
            /** 上下文hook */
            if (plugin.getContext) {
                let context = plugin.getContext()
                if (!lodash.isEmpty(context)) {
                    for (let fnc in context) {
                        plugin[fnc](context[fnc])
                    }
                    return
                }
            }

            /** 群上下文hook */
            if (plugin.getContextGroup) {
                let context = plugin.getContextGroup()
                if (!lodash.isEmpty(context)) {
                    for (let fnc in context) {
                        plugin[fnc](context[fnc])
                    }
                    return
                }
            }
        }
        for (let plugin of priority) {
            /** 正则匹配 */
            if (plugin.rule) {
                for (let v of plugin.rule) {
                    /** 判断事件 */
                    if (v.event && !this.filtEvent(e, v)) continue
                    if (new RegExp(v.reg).test(e.msg)) {
                        e.logFnc = `[${plugin.name}][${v.fnc}]`
                        if (v.log !== false) {
                            logger.mark(`${e.logFnc}${e.logText} ${lodash.truncate(e.msg, { length: 80 })}`)
                        }
                        try {
                            plugin.segment = segment
                            let res
                            if (v?.fuc) {
                                res = v.fuc(e)
                            } else {
                                res = plugin[v.fnc](e)
                            }
                            let start = Date.now()
                            if (util.types.isPromise(res)) res = await res
                            if (res !== false) {
                                /** 设置冷却cd */
                                if (v.log !== false) {
                                    logger.mark(chalk.rgb(0, 255, 0)(`[千羽插件]`), chalk.rgb(255, 255, 0)(`[${plugin.name}]`), chalk.rgb(128, 255, 0)(`执行了${chalk.rgb(204, 255, 204)(v.fnc)}方法`));
                                    logger.mark(`${e.logFnc} ${lodash.truncate(e.msg, { length: 80 })} 处理完成 ${Date.now() - start}ms`)
                                }
                                break
                            }
                        } catch (error) {
                            logger.error(`${e.logFnc}`)
                            logger.error(error.stack)
                            break
                        }
                    }
                }
            }
        }
    }

    async getConfig() {
        if (this.isYunzai()) {
            let { default: config } = await import('../../../lib/config/config.js')
            return config
        }
    }

    creatTask() {
        if (process.argv[1].includes('test')) return
        this.task.forEach((val) => {
            val.job = timer.SetTimeTask(val.name, val.cron, async () => {
                try {
                    if (val.log === true) {
                        logger.mark(`开始定时任务：${val.name}`)
                    }
                    let res = val.fnc()
                    if (util.types.isPromise(res)) res = await res
                    if (val.log === true) {
                        logger.mark(`定时任务完成：${val.name}`)
                    }
                } catch (error) {
                    logger.error(`定时任务报错：${val.name}`)
                    logger.error(error)
                }
            })
        })
    }

    isYunzai() {
        let packjson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
        if (packjson.name !== 'qianshi-Bot') return true
        return false
    }


    async onlyReplyAt(e) {

        if (!e.message || e.isPrivate) return true

        let config = await this.getConfig()

        let groupCfg = config.getGroup(e.group_id)

        if (groupCfg.onlyReplyAt != 1 || !groupCfg.botAlias) return true

        /** at机器人 */
        if (e.atBot) return true

        /** 消息带前缀 */
        if (e.hasAlias) return true

        return false
    }


    async dealMsg(e) {
        if (e.msg) return
        if (e.message) {
            for (let val of e.message) {
                switch (val.type) {
                    case 'text':
                        /** 中文#转为英文 */
                        val.text = val.text.replace(/＃|井/g, '#').trim()
                        if (e.msg) {
                            e.msg += val.text
                        } else {
                            e.msg = val.text.trim()
                        }
                        break
                    case 'image':
                        if (!e.img) {
                            e.img = []
                        }
                        e.img.push(val.url)
                        break
                    case 'at':
                        if (val.qq == Bot.uin) {
                            e.atBot = true
                        } else {
                            /** 多个at 以最后的为准 */
                            e.at = val.qq
                        }
                        break
                    case 'file':
                        e.file = { name: val.name, fid: val.fid }
                        break
                }
            }
        }

        e.logText = ''

        if (e.message_type == 'private' || e.notice_type == 'friend') {
            e.isPrivate = true

            if (e.sender) {
                e.sender.card = e.sender.nickname
            } else {
                e.sender = {
                    card: e.friend?.nickname,
                    nickname: e.friend?.nickname
                }
            }

            e.logText = `[私聊][${e.sender.nickname}(${e.user_id})]`
        }

        if (e.message_type == 'group' || e.notice_type == 'group') {
            e.isGroup = true
            if (e.sender) {
                e.sender.card = e.sender.card || e.sender.nickname
            } else if (e.member) {
                e.sender = {
                    card: e.member.card || e.member.nickname
                }
            } else if (e.nickname) {
                e.sender = {
                    card: e.nickname,
                    nickname: e.nickname
                }
            } else {
                e.sender = {
                    card: '',
                    nickname: ''
                }
            }

            if (!e.group_name) e.group_name = e.group?.name

            e.logText = `[${e.group_name}(${e.sender.card})]`
        }
        let config = await this.getConfig()

        if (e.user_id && config.masterQQ.includes(Number(e.user_id))) {
            e.isMaster = true
        }

        /** 只关注主动at msg处理 */
        if (e.msg && e.isGroup) {
            let groupCfg = config.getGroup(e.group_id)
            let alias = groupCfg.botAlias
            if (!Array.isArray(alias)) {
                alias = [alias]
            }
            for (let name of alias) {
                if (e.msg.startsWith(name)) {
                    e.msg = lodash.trimStart(e.msg, name).trim()
                    e.hasAlias = true
                    break
                }
            }
        }
    }

    collectTimeTask() {
        this.priority.forEach((priority) => {
            if (!priority?.task) return
            if (Array.isArray(priority.task)) {
                priority.task.forEach((val) => {
                    if (!val.cron) return
                    if (!val.name) throw new Error('插件任务名称错误')
                    this.task.push(val)
                })
            } else {
                if (priority.task.fnc && priority.task.cron) {
                    if (!priority.task.name) throw new Error('插件任务名称错误')
                    this.task.push(priority.task)
                }

            }
        })
    }


    filtEvent(e, v) {
        let event = v.event.split('.')
        let eventMap = {
            message: ['post_type', 'message_type', 'sub_type'],
            notice: ['post_type', 'notice_type', 'sub_type'],
            request: ['post_type', 'request_type', 'sub_type']
        }
        let newEvent = []
        event.forEach((val, index) => {
            if (val === '*') {
                newEvent.push(val)
            } else if (eventMap[e.post_type]) {
                newEvent.push(e[eventMap[e.post_type][index]])
            }
        })
        newEvent = newEvent.join('.')

        if (v.event == newEvent) return true

        return false
    }

    /** 监听热更新 */
    watch(dirName, appName) {
        this.watchDir(dirName)
        if (this.watcher[`${appName}`]) return

        let file = `./plugins/${pluginName}/apps/${appName}`
        const watcher = chokidar.watch(file)
        let key = `${appName}`

        /** 监听修改 */
        watcher.on('change', async path => {
            logger.mark(`[修改千羽插件][${appName}]`)

            let tmp = {}
            try {
                tmp = await import(`../${dirName}/${appName}?${moment().format('x')}`)
            } catch (error) {
                logger.error(`载入插件错误：${logger.red(appName)}`)
                logger.error(decodeURI(error.stack))
                return
            }

            if (tmp.apps) tmp = { ...tmp.apps }
            lodash.forEach(tmp, (p) => {
                /* eslint-disable new-cap */
                let plugin = new p()
                for (let i in this.priority) {
                    if (this.priority[i].key == key) {
                        this.priority[i].class = p
                        this.priority[i].priority = plugin.priority
                    }
                }
            })

            this.priority = lodash.orderBy(this.priority, ['priority'], ['asc'])
        })

        /** 监听删除 */
        watcher.on('unlink', async path => {
            logger.mark(`[卸载插件][${appName}]`)
            for (let i in this.priority) {
                if (this.priority[i].key == key) {
                    this.priority.splice(i, 1)
                    /** 停止更新监听 */
                    this.watcher[`${appName}`].removeAllListeners('change')
                    break
                }
            }
        })

        this.watcher[`${appName}`] = watcher
    }

    /** 监听文件夹更新 */
    watchDir(dirName) {
        if (this.watcher[dirName]) return

        let file = `./plugins/${pluginName}/${dirName}/`
        const watcher = chokidar.watch(file)

        /** 热更新 */
        setTimeout(() => {
            /** 新增文件 */
            watcher.on('add', async PluPath => {
                let appName = path.basename(PluPath)
                if (!appName.endsWith('.js')) return
                if (!this.filemage.ExistsFile(`${appName}`)) return

                let key = `${appName}`

                this.watch(dirName, appName)

                /** 太快了延迟下 */
                await new common().sleep(500)

                logger.mark(`[新增插件][${appName}]`)
                let tmp = {}
                try {
                    tmp = await import(`../${dirName}/${appName}?${moment().format('X')}`)
                } catch (error) {
                    logger.error(`载入插件错误：${logger.red(appName)}`)
                    logger.error(decodeURI(error.stack))
                    return
                }

                if (tmp.apps) tmp = { ...tmp.apps }

                lodash.forEach(tmp, (p) => {
                    if (!p.prototype) {
                        logger.error(`[载入失败][${appName}] 格式错误已跳过`)
                        return
                    }
                    /* eslint-disable new-cap */
                    let plugin = new p()

                    plugin.init && plugin.init()
                    this.priority.push({
                        name: plugin.name,
                        event: plugin.event,
                        class: p,
                        key: `${appName}`,
                        priority: plugin.priority,
                        task: plugin.task,
                    })
                })

                /** 优先级排序 */
                this.priority = lodash.orderBy(this.priority, ['priority'], ['asc'])

            })
        }, 500)

        this.watcher[dirName] = watcher
    }
}

export default new pluginLoader()