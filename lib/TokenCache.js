export class TokenCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, token, expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    this.cache.set(key, { token, expiresAt });
    console.log(`Token set for key: ${key}, expires in ${expiresIn} seconds.`);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      console.log(`No token found for key: ${key}.`);
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      console.log(`Token expired for key: ${key}.`);
      return undefined;
    }
    console.log(`Token retrieved for key: ${key}.`);
    return entry.token;
  }
}
