
import schedule from 'node-schedule'

class Timer {
    /******* 
     * @description: 
     * @param {*} name 定时任务名字
     * @param {*} cron corn表达式 具体如何表达请参考官网
     * @param {*} fuc 调用的方法
     * @return {*}
     * @use: 
     */
    SetTimeTask(name, cron, fuc) {
        this.CancelTimeTask(name)
        schedule.scheduleJob(name, cron, async () => {
            try {
                fuc()
            } catch (error) {
                console.log(error);
            }
        })
    }

    CancelTimeTask(name) {
        return schedule.cancelJob(name)
    }


    get allTimeTask() {
        return schedule.scheduledJobs
    }

    get allTimeTaskName() {
        let list = []
        for (let t in schedule.scheduledJobs) {
            list.push(t)
        }
        return list
    }

    CancelAllTimeTask() {
        this.allTimeTaskName.forEach((item) => {
            this.CancelTimeTask(item)
        })
    }


    /******* 
     * @description: 休眠
     * @param {*} ms 毫秒
     * @return {*} promise
     * @use: 
     */
    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

}

export default new Timer()

