import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { exec } = require('child_process')
class ffmpeg {

    checkEnv() {
        return new Promise((resolve, reject) => {
            exec('ffmpeg -version', (err) => {
                if (err) {
                    console.log("ffmepg未安装");
                    resolve(false)
                }
                resolve(true)
            })
        })
    }

    VideoComposite(path = '', path2 = '', resultPath = '', suc, faith = () => { }) {
        exec(`ffmpeg -y -i ${path} -i ${path2} -c copy ${resultPath}`, async function (err) {
            if (err) {
                console.log(err);
                console.log("合成失败了");
                await faith()
            } else {
                console.log("成功合成了");
                await suc()
            }
        })
    }
}

export default new ffmpeg()