import fs from 'fs'
import networks from './networks.js'
import Path from '../model/base/Path.js'
class downfile {
    async downVideo(data, path, suc = () => { }) {
        return new Promise(async (resolve, reject) => {
            new networks({
                url: data.url,
                headers: data.headers,
                type: 'arrayBuffer'
            }
            ).getData().then(res => {
                fs.writeFile(Path.qianyuPath + '/resources/video/' + path, Buffer.from(res), "binary", async function (err) {
                    if (!err) {
                        suc()
                        resolve(true)
                    }
                });
            })
        })
    }

    async downImg(data, path, suc = () => { }) {
        return new Promise(async (resolve, reject) => {
            new networks({
                url: data.url,
                headers: data.headers,
                type: 'arrayBuffer'
            }
            ).getData().then(res => {
                fs.writeFile(Path.qianyuPath + '/resources/img/' + path, Buffer.from(res), "binary", async function (err) {
                    if (!err) {
                        suc()
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                });
            })
        })
    }
}
export default new downfile()
// await new downfile().downImg({ url: 'https://image.dbbqb.com/202307311958/4ec401cddb9b09cc8f5a41bc868d23bf/eNZz0' }, '打断复读.jpg', () => {
//     console.log("成功了");
// })