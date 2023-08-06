import fs from 'fs'
import Path from './base/Path.js'
import lodash from 'lodash'

const _logPath = `${Path.qianyuPath}/VERSIONLOG.md`

const getLine = function (line) {
    line = line.replace(/(^\s*\*|\r)/g, '')
    line = line.replace(/\s*`([^`]+`)/g, '<span class="cmd">$1')
    line = line.replace(/`\s*/g, '</span>')
    line = line.replace(/\s*\*\*([^\*]+\*\*)/g, '<span class="strong">$1')
    line = line.replace(/\*\*\s*/g, '</span>')
    line = line.replace(/ⁿᵉʷ/g, '<span class="new"></span>')
    return line
}

const readLogFile = function (versionCount = 4) {
    let logPath = _logPath
    let logs = {}
    let changelogs = []
    let currentVersion

    try {
        if (fs.existsSync(logPath)) {
            logs = fs.readFileSync(logPath, 'utf8') || ''
            logs = logs.split('\n')
            let temp = {}
            let lastLine = {}
            lodash.forEach(logs, (line) => {
                if (versionCount <= -1) {
                    return false
                }
                let versionRet = /^#\s*([0-9a-zA-Z\\.~\s]+?)\s*$/.exec(line)
                if (versionRet && versionRet[1]) {
                    let v = versionRet[1].trim()
                    if (!currentVersion) {
                        currentVersion = v
                    } else {
                        changelogs.push(temp)
                        if (/0\s*$/.test(v) && versionCount > 0) {
                            versionCount = 0
                        } else {
                            versionCount--
                        }
                    }

                    temp = {
                        version: v,
                        logs: []
                    }
                } else {
                    if (!line.trim()) {
                        return
                    }
                    if (/^\*/.test(line)) {
                        lastLine = {
                            title: getLine(line),
                            logs: []
                        }
                        temp.logs.push(lastLine)
                    } else if (/^\s{2,}\*/.test(line)) {
                        lastLine.logs.push(getLine(line))
                    }
                }
            })
        }
    } catch (e) {
        // do nth
    }
    return { changelogs, currentVersion }
}
let packJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
let { currentVersion: qianyuVersion, changelogs } = readLogFile()
export { qianyuVersion, changelogs, packJson }