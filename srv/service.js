const cds = require("@sap/cds");

class PrintService extends cds.Service {
  async init() {
    this.on("READ", this.entities.Queues, async (req) => {
      const queues = await this.getQueues();

      // return queues;
      return this.applyOdataRequestOptions(queues, req);
    });

    super.init();
  }
  // only works for entities as projections on queue entity defined in index.cds
  // Use case: provide VH to FE as SAP Print service provides a REST endpoint to get queues
  applyOdataRequestOptions(queues, req) {
    let result = queues;

    const orderby = req.query.SELECT.orderBy;
    const search = req.query.SELECT.search;
    const count = req.query.SELECT.count;
    const top =
      req.query.SELECT.limit && req.query.SELECT.limit.rows && req.query.SELECT.limit.rows.val;
    const skip =
      req.query.SELECT.limit && req.query.SELECT.limit.offset && req.query.SELECT.limit.offset.val;
    const filter = req.query.SELECT.where;

    if (filter && Array.isArray(filter) && filter.length === 3) {
      const [field, op, valueObj] = filter;
      if (!field.ref || field.ref[0] !== "ID" || op !== "=" || !valueObj.val) {
        return req.reject(
          400,
          "Invalid $filter format. Expected: [{ref:['ID']}, '=', {val:'<value>'}]",
        );
      }
      const filterValue = valueObj.val;
      result = result.filter((queue) => queue.ID === filterValue);
    } else if (search && Array.isArray(search) && search.length > 0 && search[0].val) {
      const searchTerm = search[0].val.toLowerCase();
      result = result.filter((queue) => queue.ID.toLowerCase().includes(searchTerm));
      result = result.sort((a, b) => a.ID.localeCompare(b.ID));
    }

    if (orderby && Array.isArray(orderby) && orderby.length > 0) {
      const { ref, sort } = orderby[0];
      if (!ref || ref[0] !== "ID") {
        return req.reject(400, "Invalid $orderby field. Only 'ID' is supported.");
      }
      result = result.sort((a, b) => {
        const comparison = a.ID.localeCompare(b.ID);
        return sort === "desc" ? -comparison : comparison;
      });
    }

    const skipNumber = parseInt(skip || "0", 10);
    const topNumber = parseInt(top || result.length, 10);
    result = result.slice(skipNumber, skipNumber + topNumber);

    if (count) {
      result.$count = result.length;
    }
    return result;
  }
}

module.exports = PrintService;
