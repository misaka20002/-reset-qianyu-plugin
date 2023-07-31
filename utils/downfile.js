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