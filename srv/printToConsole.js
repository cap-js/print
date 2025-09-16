const PrintService = require('./service')


export default class PrintToConsole extends PrintService {
  async init() {
    this.on('*', function (req) {
      const { event, data } = req

      console.log(`[print-log] - ${event}:`, data)
    })

    // call PrintService's init
    await super.init()
  }
}
