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
        try {
            let data = {
                headers: this.headers,
                method: this.method,
            }
            if (this.method == 'post') {
                data = { ...data, body: JSON.stringify(this.body) || '' }
            }
            return await fetch(this.url, data)
        } catch (error) {
            return false
        }

    }

    async getData(new_fetch = '') {
        try {
            if (!new_fetch) {
                this.fetch = await fetch(this.url, {
                    headers: this.headers,
                    method: this.method
                })
            } else {
                this.fetch = new_fetch
            }
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
        } catch (error) {
            return false
        }

    }

    async Tojson() {
        if (this.fetch.headers.get('content-type').includes('json')) {
            this.fetch = await this.fetch.json()
        } else {
            this.fetch = await this.fetch.text()
            this.type = 'text'
        }

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
