import fetch from "node-fetch";
import https from 'https'
export default class networks {

    constructor(data) {
        this.url = data.url
        this.headers = data.headers || {}
        this.type = data.type || 'json'
        this.method = data.method || 'get'
        this.body = data.body || ''
        this.agent = data.isAgent ? new https.Agent({
            rejectUnauthorized: false,
        }) : ''
        this.timeout = data.timeout || 15000
    }

    get config() {
        let data = {
            headers: this.headers,
            method: this.method,
            agent: this.agent,
        }
        if (this.method == 'post') {
            data = { ...data, body: JSON.stringify(this.body) || '' }
        }
        return data
    }

    async getfetch() {
        return new Promise((resolve, reject) => {
            this.timeOut(this.timeout).then(response => {
                if (response.ok) {
                    resolve(response)
                }
                throw new Error('请求错误！');
            }).catch(error => {
                resolve({ status: 500, message: '请求错误' })
            })
        })
    }

    async redirectUrl() {
        return (await fetch(this.url, this.config)).url
    }

    async timeOut(time = 5000) {
        return Promise.race([fetch(this.url, this.config), new Promise((resolve, reject) => {
            setTimeout(() => reject({ message: "请求超时", status: 504 }), time);
        })])
    }

    async getData() {
        // 设置超时时间为5秒
        return new Promise(async (resolve, reject) => {
            this.timeOut(this.timeout).then(response => {
                if (response.ok) {
                    return this.dealType(response)
                }
                throw new Error('请求错误！');
            }).then(data => {
                // 处理获取到的数据
                resolve(data)
            }).catch(error => {
                // 处理错误
                resolve({ status: 500, message: error })
            })
        })
    }

    dealType(response) {
        switch (this.type) {
            case 'json':
                if (response.headers.get('content-type').includes('json')) {
                    return response.json()
                } else {
                    this.type = 'text'
                    return response.text()
                }
            case 'text':
                return response.text()
            case 'arrayBuffer':
                return response.arrayBuffer()
            case 'blob':
                return response.blob()
        }
    }
}

