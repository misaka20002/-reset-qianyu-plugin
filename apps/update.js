import Base from '../model/base/Base.js'
import { createRequire } from 'module'
import lodash from 'lodash'
const require = createRequire(import.meta.url)
const { exec, execSync } = require('child_process')

let uping = false

export class update extends Base {
    constructor() {
        super({
            name: 'update',
            priority: 50,
            rule: [
                {
                    reg: '^#千羽(强制)*更新$',
                    fnc: 'update'
                },
                {
                    reg: '^#千羽更新日志$',
                    fnc: 'updateLog'
                }
            ]
        })

        this.typeName = '千羽插件'
        this.key = "qianyu-update"
    }

    async init() {
        let restart = await redis.get(this.key)
        if (restart && process.argv[1].includes('pm2')) {
            restart = JSON.parse(restart)
            let time = restart.time || new Date().getTime()
            time = (new Date().getTime() - time) / 1000

            let msg = `重启成功：耗时${time.toFixed(2)}秒`

            if (restart.isGroup) {
                Bot.pickGroup(restart.id).sendMsg(msg)
            } else {
                Bot.pickUser(restart.id).sendMsg(msg)
            }
            redis.del(this.key)
        }
    }

    async update() {
        if (!this.e.isMaster) return false
        if (uping) {
            await this.reply('已有命令更新中..请勿重复操作')
            return
        }

        /** 检查git安装 */
        if (!await this.checkGit()) return

        /** 执行更新 */
        await this.runUpdate('reset-qianyu-plugin')

        /** 是否需要重启 */
        if (this.isUp) {
            await this.reply('即将执行重启，以应用更新')
            setTimeout(async () => await this.restart(), 2000)
        }
    }

    async checkGit() {
        let ret = await execSync('git --version', { encoding: 'utf-8' })
        if (!ret || !ret.includes('git version')) {
            await this.reply('请先安装git')
            return false
        }

        return true
    }


    async execSync(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, { windowsHide: true }, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr })
            })
        })
    }

    async runUpdate(plugin = '') {
        this.isNowUp = false

        let cm = 'git pull --no-rebase'

        let type = '更新'

        if (plugin) {
            cm = `git -C ./plugins/${plugin}/ pull --no-rebase`
        }

        if (this.e.msg.includes('强制')) {
            type = '强制更新'
            cm = `git checkout . && ${cm}`
        }


        this.oldCommitId = await this.getcommitId(plugin)

        logger.mark(`${this.e.logFnc} 开始${type}：${this.typeName}`)

        await this.reply(`开始#${type}${this.typeName}`)
        uping = true
        let ret = await this.execSync(cm)
        uping = false

        if (ret.error) {
            logger.mark(`${this.e.logFnc} 更新失败：${this.typeName}`)
            this.gitErr(ret.error, ret.stdout)
            return false
        }

        let time = await this.getTime(plugin)

        if (/Already up|已经是最新/g.test(ret.stdout)) {
            await this.reply(`${this.typeName}已经是最新\n最后更新时间：${time}`)
        } else {
            await this.reply(`${this.typeName}更新成功\n更新时间：${time}`)
            this.isUp = true
            let log = await this.getLog(plugin)
            await this.reply(log)
        }

        logger.mark(`${this.e.logFnc} 最后更新时间：${time}`)

        return true
    }

    async getcommitId(plugin = '') {
        let cm = 'git rev-parse --short HEAD'
        if (plugin) {
            cm = `git -C ./plugins/${plugin}/ rev-parse --short HEAD`
        }

        let commitId = await execSync(cm, { encoding: 'utf-8' })
        commitId = lodash.trim(commitId)

        return commitId
    }

    async getTime(plugin = '') {
        let cm = 'git log  -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"'
        if (plugin) {
            cm = `cd ./plugins/${plugin}/ && git log -1 --oneline --pretty=format:"%cd" --date=format:"%m-%d %H:%M"`
        }

        let time = ''
        try {
            time = await execSync(cm, { encoding: 'utf-8' })
            time = lodash.trim(time)
        } catch (error) {
            logger.error(error.toString())
            time = '获取时间失败'
        }

        return time
    }

    async gitErr(err, stdout) {
        let msg = '更新失败！'
        let errMsg = err.toString()
        stdout = stdout.toString()

        if (errMsg.includes('Timed out')) {
            let remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
            await this.reply(msg + `\n连接超时：${remote}`)
            return
        }

        if (/Failed to connect|unable to access/g.test(errMsg)) {
            let remote = errMsg.match(/'(.+?)'/g)[0].replace(/'/g, '')
            await this.reply(msg + `\n连接失败：${remote}`)
            return
        }

        if (errMsg.includes('be overwritten by merge')) {
            await this.reply(msg + `存在冲突：\n${errMsg}\n` + '请解决冲突后再更新，或者执行#强制更新，放弃本地修改')
            return
        }

        if (stdout.includes('CONFLICT')) {
            await this.reply([msg + '存在冲突\n', errMsg, stdout, '\n请解决冲突后再更新，或者执行#强制更新，放弃本地修改'])
            return
        }

        await this.reply([errMsg, stdout])
    }

    async restart(e) {
        await this.e.reply('开始执行重启，请稍等...')
        logger.mark(`${this.e.logFnc} 开始执行重启，请稍等...`)

        let data = JSON.stringify({
            isGroup: !!this.e.isGroup,
            id: this.e.isGroup ? this.e.group_id : this.e.user_id,
            time: new Date().getTime()
        })

        let npm = await this.checkPnpm()

        try {
            await redis.set(this.key, data, { EX: 120 })
            let cm = `${npm} start`
            if (process.argv[1].includes('pm2')) {
                cm = `${npm} run restart`
            } else {
                await this.e.reply('当前为前台运行，重启将转为后台...')
            }

            exec(cm, { windowsHide: true }, (error, stdout, stderr) => {
                if (error) {
                    redis.del(this.key)
                    this.e.reply(`操作失败！\n${error.stack}`)
                    logger.error(`重启失败\n${error.stack}`)
                } else if (stdout) {
                    logger.mark('重启成功，运行已由前台转为后台')
                    logger.mark(`查看日志请用命令：${npm} run log`)
                    logger.mark(`停止后台运行命令：${npm} stop`)
                    process.exit()
                }
            })
        } catch (error) {
            redis.del(this.key)
            let e = error.stack ?? error
            this.e.reply(`操作失败！\n${e}`)
        }

        return true
    }


    async checkPnpm() {
        let npm = 'npm'
        let ret = await this.execSync('pnpm -v')
        if (ret.stdout) npm = 'pnpm'
        return npm
    }

    async getLog(plugin = '') {
        plugin = 'reset-qianyu-plugin'
        let cm = 'git log  -20 --oneline --pretty=format:"%h||[%cd]  %s" --date=format:"%m-%d %H:%M"'
        if (plugin) {
            cm = `cd ./plugins/${plugin}/ && ${cm}`
        }

        let logAll
        try {
            logAll = await execSync(cm, { encoding: 'utf-8' })
        } catch (error) {
            logger.error(error.toString())
            this.reply(error.toString())
        }

        if (!logAll) return false

        logAll = logAll.split('\n')

        let log = []
        for (let str of logAll) {
            str = str.split('||')
            if (str[0] == this.oldCommitId) break
            if (str[1].includes('Merge branch')) continue
            log.push(str[1])
        }
        let line = log.length
        log = log.join('\n\n')

        if (log.length <= 0) return ''

        let end = ''
        if (!plugin) {
            end = '更多详细信息，请前往gitee查看\nhttps://gitee.com/think-first-sxs/reset-qianyu-plugin'
        }

        log = [{
            content: log
        }]
        if (end) {
            log.push({
                content: end
            })
        }
        log = await this.makeGroupMsg(`${plugin || 'Qianyu-Bot'}更新日志，共${line}条`, log)
        return log
    }


    async updateLog() {
        let log = await this.getLog()
        await this.reply(log)
    }
}
