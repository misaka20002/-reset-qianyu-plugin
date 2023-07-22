export default class common {
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}