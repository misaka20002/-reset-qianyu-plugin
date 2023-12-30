import EventListener from '../EventListener.js'

/**
 * 监听群聊消息
 */
export default class messageEvent extends EventListener {
  constructor() {
    super({ event: 'message' })
  }

  async execute(e) {
    this.dealUrl(e)
    this.dealJson(e)
    this.plugins.deal(e)
  }

  dealUrl(e) {
    let msg = e.msg
    if (!e.msg) {
      e.message.forEach(element => {
        if (element.type == 'text') {
          msg += element?.text?.trim()
        }
      });
    }
    if (!msg) return
    const regurl = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    let url = msg.match(regurl)
    if (!url) return
    e.url = url[0]
  }

  dealJson(e) {
    if (e.raw_message === '[json消息]') {
      e.json = JSON.parse(e.message[0].data)
    }
  }
}
