import fs from 'fs'
import Networks from './networks.js'
import Path from '../model/base/Path.js'
class downfile {
    async downVideo(data, path, suc = () => { }) {
        return new Promise(async (resolve, reject) => {
            let networks = new Networks({
                url: data.url,
                headers: data.headers,
                type: 'arrayBuffer',
                isAgent: data.isAgent || false
            })
            let fetch = await networks.getfetch()
            let code = fetch.status
            if (code !== 200) {
                suc(false)
                return resolve(false)
            }
            networks.getData().then(res => {
                fs.writeFile(Path.qianyuPath + '/resources/video/' + path, Buffer.from(res), "binary", async function (err) {
                    if (!err) {
                        suc(true)
                        resolve(true)
                    }
                });
            })
        })
    }

    async downImg(data, path, suc = () => { }) {
        return new Promise(async (resolve, reject) => {
            new Networks({
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
// await new downfile().downImg({urtl})