const cds = require('@sap/cds');
const LOG = cds.log('print');

class PrintService extends cds.Service {

  /**
   * Sends a document to print. Method print can be used alternatively.
   * @param {string} [event] - The print action event.
   * @param {object} message - The print request object
   */
  emit(event, message) {
    if (!event) {
      LOG._warn && LOG.warn('No object provided for print');
      return;
    }
    // Outbox calls us with a req object, e.g. { event, data, headers }
    if (event.event) return super.emit(event);
    // First argument is optional for convenience
    if (!message) [message, event] = [event];
    // CAP events translate to print actions and vice versa
    if (event) message.action = event;
    else event = message.action || message.ActionKey || 'Default';
    // Emit the print request
    return super.emit(event, message);
  }

  /**
   * That's just a semantic alias for emit.
   * @param {string} [event] - The print action event.
   * @param {object} message - The print request object
   */
  print(event, message) {
    return this.emit(event, message);
  }

  /**
   * Get available print queues - implemented by subclasses
   * @returns {Promise<Array>} Array of queue objects
  async getQueues() {
    throw new Error('getQueues method must be implemented by subclass');
  }
   */

}

module.exports = PrintService;

// Without Generic Outbox only alert.print() can be used, not alert.emit()
// Remove that when @sap/cds with Generic Outbox is released
if (!cds.outboxed) {
  class OutboxedNotificationService extends require('@sap/cds/libx/_runtime/messaging/Outbox') {}
  OutboxedNotificationService.prototype.notify = NotificationService.prototype.emit
  module.exports = OutboxedNotificationService
}
