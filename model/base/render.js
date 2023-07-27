import Render from "../../utils/render.js";
import Path from "./Path.js";
import { qianyuVersion } from '../version.js'
export default async function returnImg(name, data) {
    return await Render.render('reset-qianyu-plugin', `/html/${name}/${name}.html`, {
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
                    version: qianyuVersion
                }
            }
        }
    )
}