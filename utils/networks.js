import fetch from "node-fetch";
export default class networks {

    constructor(data) {
        this.url = data.url
        this.headers = data.headers || {}
        this.type = data.type || 'json'
        this.method = data.method || 'get'
        this.body = data.body || ''
        this.data = {}

    }

    async getfetch() {
        let data = {
            headers: this.headers,
            method: this.method,

        }
        if (this.method == 'post') {
            data = { ...data, body: JSON.stringify(this.body) || '' }
        }
        return await fetch(this.url, data)
    }

    async getData() {
        this.fetch = await fetch(this.url, {
            headers: this.headers,
            method: this.method
        })

        switch (this.type) {
            case 'json':
                await this.Tojson()
                break;
            case 'text':
                await this.ToText()
                break;
            case 'arrayBuffer':
                await this.ToArrayBuffer()
                break;
            case 'blob':
                await this.ToBlob()
                break;
        }
        return this.fetch
    }

    async Tojson() {
        this.fetch = await this.fetch.json()
    }

    async ToText() {
        this.fetch = await this.fetch.text()
    }

    async ToArrayBuffer() {
        this.fetch = await this.fetch.arrayBuffer()
    }
    async ToBlob() {
        this.fetch = await this.fetch.blob()
    }

}