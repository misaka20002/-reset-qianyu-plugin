import Render from "../../utils/render.js";
import Runtime from '../../../../lib/plugins/runtime.js'
import Path from "./Path.js";
import Config from "./Config.js";
import { qianyuVersion, packJson } from '../version.js'
export default async function returnImg(name, data) {
    let render = Render.render
    let mode = Config.GetCfg('system/puppeteer').mode
    if (mode === 'yunzai') {
        render = new Runtime().render
    }
    return await render('reset-qianyu-plugin', `/html/${name}/${name}.html`, {
        ...data,
    },
        {
            retType: 'base64',
            beforeRender({ data }) {
                let resPath = data.pluResPath
                return {
                    defaulthtml: Path.qianyuPath + '/resources/html/common/' + 'default.html',
                    ...data,
                    _res_path: resPath,
                    version: qianyuVersion,
                    botname: packJson.name,
                    imgType: 'png'
                }
            }
        }
    )
}