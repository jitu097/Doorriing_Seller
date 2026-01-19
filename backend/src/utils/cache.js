class CacheService {
    constructor() {
        this.cache = new Map();
    }

    async get(key) {
        return this.cache.get(key);
    }

    async set(key, value, ttlSeconds = 300) {
        this.cache.set(key, value);
        if (ttlSeconds) {
            setTimeout(() => {
                this.cache.delete(key);
            }, ttlSeconds * 1000);
        }
    }

    async del(key) {
        this.cache.delete(key);
    }

    async flush() {
        this.cache.clear();
    }
}

// Singleton instance
module.exports = new CacheService();
