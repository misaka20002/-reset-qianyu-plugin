import fetch from "node-fetch";
export default class networks {

    constructor(data) {
        this.url = data.url
        this.headers = data.headers || {}
        this.type = data.type || 'json'
        this.method = data.method || 'get'
        this.data = {}
    }

    async getfetch() {
        return await fetch(this.url, {
            headers: this.headers,
            method: this.method
        })
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

}