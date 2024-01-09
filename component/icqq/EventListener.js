import Filemage from '../../utils/Filemage.js'
import lodash from 'lodash'
import pluginLoader from '../../lib/pluginLoader.js'
import Path from '../../model/base/Path.js'
await pluginLoader.getApps()
export default class EventListener {
    /**
     * 事件监听
     * @param data.prefix 事件名称前缀
     * @param data.event 监听的事件
     * @param data.once 是否只监听一次
     */
    constructor(data) {
        this.prefix = data.prefix || ''
        this.event = data.event
        this.once = data.once || false
        this.plugins = pluginLoader
    }
}



/**
 * 加载监听事件
 */
class ListenerLoader {
    /**
     * 监听事件加载
     * @param client Bot示例
     */
    async load(client) {
        this.client = client
        pluginLoader.Bot = client
        let filemag = new Filemage(Path.qianyuPath + './component/icqq/Event')
        const files = filemag.GetfileList().filter(file => file.endsWith('.js'))
        for (let File of files) {
            try {
                let listener = await import(`./Event/${File}`)

                /* eslint-disable new-cap */
                if (!listener.default) continue
                listener = new listener.default()
                listener.client = this.client
                const on = listener.once ? 'once' : 'on'

                if (lodash.isArray(listener.event)) {
                    listener.event.forEach((type) => {
                        const e = listener[type] ? type : 'execute'
                        this.client[on](listener.prefix + type, event => listener[e](event))
                    })
                } else {
                    const e = listener[listener.event] ? listener.event : 'execute'
                    this.client[on](listener.prefix + listener.event, event => listener[e](event))
                }
            } catch (e) {
                logger.mark(`监听事件错误：${File}`)
                logger.error(e)
            }
        }
    }
}

export { ListenerLoader }
