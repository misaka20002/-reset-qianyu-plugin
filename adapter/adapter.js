import cfg from '../../../lib/config/config.js'
import Filemage from '../utils/Filemage.js';
let file = new Filemage()
//在这里写一些适配的方法
const getBot = () => {
    if (cfg?.qq && (file.GetfileList('/plugins').includes('ws-plugin') || file.GetfileList('/plugins').includes('Lain-plugin'))) {
        return Bot[cfg?.qq]
    }
    return Bot
}
export default getBot