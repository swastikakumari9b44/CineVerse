class Cache {
  constructor(defaultTTL = 300 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}
module.exports = new Cache();