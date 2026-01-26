class InMemoryCache {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        
        return item.value;
    }

    set(key, value, ttlSeconds = 300) {
        this.store.set(key, {
            value,
            expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
        });
    }

    delete(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    deletePattern(pattern) {
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) {
                this.store.delete(key);
            }
        }
    }
}

module.exports = new InMemoryCache();
