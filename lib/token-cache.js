import cds from "@sap/cds";
const LOG = cds.log("print");
export class TokenCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, token, expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000;
    this.cache.set(key, { token, expiresAt });
    LOG.debug(`Token set for key: ${key}, expires in ${expiresIn} seconds.`);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      LOG.debug(`No token found for key: ${key}.`);
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      LOG.debug(`Token expired for key: ${key}.`);
      return undefined;
    }
    LOG.debug(`Token retrieved for key: ${key}.`);
    return entry.token;
  }
}
