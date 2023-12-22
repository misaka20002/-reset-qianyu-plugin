import path from 'path'
class Path {
    get qianyuPath() {
        return process.cwd() + path.join('/plugins/reset-qianyu-plugin/')
    }

    get resourcePath() {
        return this.qianyuPath + path.join('resources/')
    }
}
export default new Path()