import Render from "../../utils/render.js";
export default async function returnImg(name, data) {
    return await Render.render('qianyu-plugin', `/html/${name}/${name}.html`, {
        ...data,
    },
        {
            retType: 'base64',
            beforeRender({ data }) {
                let resPath = data.pluResPath
                return {
                    ...data,
                    _res_path: resPath
                }
            }
        }
    )
}