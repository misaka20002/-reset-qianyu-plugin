class Path {
    get qianyuPath() {
        return process.cwd() + '/plugins/reset-qianyu-plugin/'
    }

    get resourcePath() {
        return this.qianyuPath + 'resources/'
    }
}
export default new Path()