const PRINT = "@PDF.Printable";
const PRINT_ACTION = "@PDF.Printable.Action";
const QUEUE_ENTITY = "@PDF.Printable.QueueEntity";
const COPIES_ELEMENT = "copies";
const QUEUE_ELEMENT = "qnameID";

module.exports = function enhanceModel(m) {
  const _enhanced = "sap.print.enhanced";
  if (m.meta?.[_enhanced]) return; // already enhanced

  for (let [eachName, each] of Object.entries(m.definitions)) {
    if (each.kind !== "entity") continue;

    if (!each[PRINT]) continue;

    each.actions ??= {};

    each.actions["print"] = {
      kind: "action",
      name: "print",
      [PRINT_ACTION]: true,
      params: {
        [QUEUE_ELEMENT]: {
          "@Common.ValueListWithFixedValues": true,
          "@Common.ValueList.$Type": "Common.ValueListType",
          "@Common.ValueList.CollectionPath": "PrintServiceQueues",
          "@Common.ValueList.Label": "{i18n>PRINT_QUEUES}",
          "@Common.ValueList.Parameters": [
            {
              $Type: "Common.ValueListParameterInOut",
              LocalDataProperty: { "=": "qnameID" },
              ValueListProperty: "ID",
            },
          ],
          "@Common.Label": "{i18n>PRINT_QUEUE}",
          type: "cds.String",
        },
        [COPIES_ELEMENT]: {
          "@Common.Label": "{i18n>NUMBER_OF_COPIES}",
          "@UI.ParameterDefaultValue": 1,
          type: "cds.Integer",
        },
      },
    };

    const serviceName = getMatchingService(m, eachName);

    each["@UI.Identification"] ??= [];
    each["@UI.Identification"].push({
      $Type: "UI.DataFieldForAction",
      Action: `${serviceName}.print`,
      Label: "{i18n>PRINT}",
    });

    m.definitions[`${serviceName}.PrintServiceQueues`] = {
      [QUEUE_ENTITY]: true,
      kind: "entity",
      projection: {
        from: { ref: ["PrintService.Queues"] },
      },
      elements: {
        ID: { key: true, type: "cds.String", '@Common.Label': '{i18n>ID}' },
        description: { type: "cds.String", '@Common.Label': '{i18n>DESCRIPTION}' },
      },
    };
  }

  m.meta ??= {};
  m.meta[_enhanced] = true;
  return m;
};

const getMatchingService = (m, entityName) =>
  Object.entries(m.definitions)
    .filter(([, def]) => def.kind === "service")
    .map(([name]) => name)
    .map((service) => ({
      service,
      matches: [...service].filter((char, i) => char === entityName[i]).length,
    }))
    .reduce((best, curr) => (curr.matches > best.matches ? curr : best), { matches: -1 }).service;
