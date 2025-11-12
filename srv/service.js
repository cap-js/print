const cds = require("@sap/cds");

class PrintService extends cds.Service {
  async init() {
    this.on("READ", this.entities.Files, async (req) => {
      const entityFilterIndex = req.query?.SELECT?.where?.findIndex(
        (item) => typeof item === "object" && Array.isArray(item.ref) && item.ref[0] === "entity",
      );
      const entityName = req.query?.SELECT?.where?.[entityFilterIndex + 2]?.val;
      if (!entityName) return req.reject({ status: 400, message: "PRINT_PROVIDE_FILTER" });
      if (req.query?.SELECT?.where && req.query.SELECT.where.length === 3) {
        delete req.query.SELECT.where;
      } else {
        req.query.SELECT.where.splice(entityFilterIndex, 4);
      }
      if (!cds.model.definitions[entityName])
        return req.reject({ status: 404, message: "PRINT_ENTITY_NOT_FOUND", args: [entityName] });

      const elements = cds.model.definitions[entityName].elements;

      const largeBinaryFields = Object.entries(elements)
        .filter(([, def]) => def.type === "cds.LargeBinary")
        .map(([name]) => ({ entityName, property: name }));

      const keyFields = Object.entries(elements)
        .filter(([, def]) => def.key)
        .map(([name]) => name);
      keyFields.sort();

      const keys = {};

      for (let i = 0; i < keyFields.length; i++) {
        const keyField = keyFields[i];
        const keyFilterIndex = req.query?.SELECT?.where?.findIndex(
          (item) =>
            typeof item === "object" &&
            Array.isArray(item.ref) &&
            item.ref[0] === `entityKey${i + 1}`,
        );
        const keyValue = req.query?.SELECT?.where?.[keyFilterIndex + 2]?.val;

        keys[keyField] = keyValue;

        if (req.query?.SELECT?.where && req.query.SELECT.where.length === 3) {
          delete req.query.SELECT.where;
        } else {
          req.query.SELECT.where.splice(keyFilterIndex, 4);
        }
      }

      const fileNames = await SELECT.one
        .from(entityName)
        .where(keys)
        .columns(
          ...largeBinaryFields.map(
            (f) =>
              cds.model.definitions[entityName].elements[f.property]["@Core.ContentDisposition"][
                "="
              ] ??
              cds.model.definitions[entityName].elements[f.property]["@Core.ContentDisposition"],
          ),
        );

      largeBinaryFields.forEach((field) => {
        const { entityName, property } = field;

        const fileNameProp =
          cds.model.definitions[entityName].elements[property]["@Core.ContentDisposition"]["="] ??
          cds.model.definitions[entityName].elements[property]["@Core.ContentDisposition"];
        field.fileName = fileNames[fileNameProp];
        field.label = cds.i18n.labels.for(cds.model.definitions[entityName].elements[property]);
        field.label ??= property;
      });

      const filteredFileFields = this.applyOdataRequestOptions(largeBinaryFields, req);
      return filteredFileFields;
    });

    this.on("READ", this.entities.Queues, async (req) => {
      let result = await this.getQueues();

      return this.applyOdataRequestOptions(result, req);
    });

    this.on("print", async (req) => {
      return await this.print(req.data);
    });

    super.init();
  }

  applyOdataRequestOptions(result, req) {
    const orderby = req.query?.SELECT?.orderBy;
    const search = req.query?.SELECT?.search;
    const count = req.query?.SELECT?.count;
    const top = req.query?.SELECT?.limit?.rows?.val;
    const skip = req.query?.SELECT?.limit?.offset?.val;
    const filter = req.query?.SELECT?.where;

    if (filter && Array.isArray(filter) && filter.length === 3) {
      const [field, op, valueObj] = filter;
      if (!field.ref || !field.ref[0] || op !== "=" || !valueObj?.val) {
        return req.reject({
          status: 400,
          message: "PRINT_INVALID_FILTER_FORMAT",
        });
      }
      const filterValue = valueObj.val;
      result = result.filter((item) => item[field.ref[0]] === filterValue);
    } else if (search && Array.isArray(search) && search.length > 0 && search[0].val) {
      const searchTerm = search[0].val.toLowerCase();
      result = result.filter((item) =>
        item.ID !== undefined
          ? item.ID.toLowerCase().includes(searchTerm)
          : item.property.toLowerCase().includes(searchTerm),
      );
      result = result.sort((a, b) =>
        a.ID !== undefined ? a.ID.localeCompare(b.ID) : a.property.localeCompare(b.property),
      );
    } else if (filter && Array.isArray(filter) && filter.length > 0 && filter[0].xpr) {
      return [];
    }

    if (orderby && Array.isArray(orderby) && orderby.length === 1) {
      const { ref, sort } = orderby[0];
      result = result.sort((a, b) => {
        const comparison = a[ref[0]].localeCompare(b[ref[0]]);
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
