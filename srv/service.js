const cds = require('@sap/cds')

module.exports = class PrintService extends cds.Service {
  async init() {
    // add common print log entry fields
    this.before('*', req => {
      const { tenant, user, timestamp } = cds.context
      req.data.uuid ??= cds.utils.uuid()
      // allows to specify undefined tenant in order to print to provider in multi-tenant scenarios
      if (!('tenant' in req.data)) req.data.tenant = tenant
      req.data.user ??= user.id
      req.data.time ??= timestamp
    })

    // call OutboxService's init
    await super.init()


    this.print = this.emit

    this.printSync = (...args) => {
      if (cds.unboxed) return cds.unboxed(this).send(...args) //> cds >= 7.5
      if (this.immediate instanceof cds.Service) return this.immediate.send(...args) //> cds ~ 7.4
      return this.send(...args) //> cds <= 7.3
    }
  }
}
