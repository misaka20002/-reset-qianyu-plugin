import common from '../../utils/common.js';
let Browser, Page
export async function headless({ cookie, timeout = 1000 * 60, headless = false, prompt }) {
    try {
        let Puppeteer = await getPuppeteer()
        if (!Puppeteer) {
            return {
                error: 0,
                msg: 'puppeteer版本需要大于v19.0,请升级puppeteer依赖后崽使用此功能！'
            }
        }
        let { puppeteer, KnownDevices } = Puppeteer
        if (!Browser) {
            Browser = await puppeteer.launch({
                headless,
                ignoreDefaultArgs: ['--enable-automation'],
                args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-setuid-sandbox'],
            })
        }
        if (!Page) {
            const page = await Browser.newPage()
            await page.emulate(KnownDevices['iPhone SE'])
            await page.setCookie(...parse_cookie(cookie))

            if (headless) {
                await page.setRequestInterception(true)
                page.on('request', request => {
                    if (['stylesheet', 'font', 'image'].includes(request.resourceType())) {
                        request.abort()
                    } else {
                        request.continue()
                    }
                })
            }

            await page.goto('https://yiyan.baidu.com')

            const need_login = await page.evaluate(() => {
                const body_text = document.body.innerText
                if (body_text.includes('接受协议') && body_text.includes('暂时退出')) {
                    for (const div of document.querySelectorAll('div')) {
                        if (div.textContent.includes('接受协议')) {
                            div?.click()
                        }
                    }
                }

                return body_text.includes('登录') && (body_text.includes('加入体验') || body_text.includes('开始体验'))
            })
            if (need_login) {
                return {
                    error: 0,
                    msg: 'cookie失效, 请重新登录'
                }
            }
            Page = page
        }
        const message_input = await Page.waitForSelector('#dialogue-input', {
            timeout,
        })
        await message_input.type(prompt)
        await new common().sleep(1000)
        await Page.evaluate(async () => {
            function get_parent_next_sibling(element) {
                const parent = element.parentNode
                let next_sibling = parent.nextSibling
                while (next_sibling && next_sibling.nodeType !== 1) {
                    next_sibling = next_sibling.nextSibling
                }
                return next_sibling
            }
            const message_input = document.querySelector('#dialogue-input')
            const send_button = get_parent_next_sibling(message_input)
            send_button.click()
        })
        let text;
        let response = await Page.waitForResponse(response => response.url().includes('https://yiyan.baidu.com/eb/chat/conversation/v2'), { timeout })

        const response_text = await response.text()
        let last_line = response_text.trim().split('\n')
        last_line = last_line.filter(item => item.startsWith('data:')).map(item => JSON.parse(item.replace('data:', ''))).find(item => item.data?.is_end === 1)
        text = last_line.data.tokens_all
        const image = text.match(/<img src="(.*?)"/)
        return { text, image: image ? image[1].replace('=style/wm_ai', '').replace('http://', 'https://') : null }
    } catch (error) {
        if (error) {
            Browser?.close()
        }
    } finally {

    }
}

async function getPuppeteer() {
    let puppeteer = await import('puppeteer')
    if (!puppeteer.KnownDevices) return false
    return { puppeteer, KnownDevices: puppeteer.KnownDevices }
}

function parse_cookie(cookie) {
    return cookie
        .trim()
        .split('; ')
        .map(item => {
            const [name, ...value] = item.split('=')
            return {
                name,
                value: value.join('='),
                domain: 'yiyan.baidu.com',
            }
        })
}