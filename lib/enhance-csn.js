const PRINT = "@PDF.Printable";
const PRINT_ACTION = "@PDF.Printable.Action";
const QUEUE_ENTITY = "@PDF.Printable.QueueEntity";
const FILE_ENTITY = "@PDF.Printable.FileEntity";
const COPIES_ELEMENT = "copies";
const QUEUE_ELEMENT = "qnameID";
const FILE_ELEMENT = "fileElement";
const cds = require("@sap/cds");

module.exports = function enhanceModel(m) {
  const _enhanced = "sap.print.enhanced";
  if (m.meta?.[_enhanced]) return; // already enhanced

  for (let [entityName, entity] of Object.entries(m.definitions)) {
    if (entity.kind !== "entity") continue;

    if (!entity[PRINT]) continue;

    const numberOfFiles = Object.values(entity.elements).filter(
      (def) => def.type === "cds.LargeBinary",
    ).length;

    entity.actions ??= {};

    const keys = Object.entries(entity.elements)
      .filter(([, def]) => def.key)
      .map(([name]) => name);

    if (keys.length > 10)
      return cds.error(
        `Entities with more than 10 key fields are not supported for printing: ${entityName}`,
      );

    keys.sort();

    entity.actions["print"] = {
      kind: "action",
      name: "print",
      [PRINT_ACTION]: true,
      params: {
        [QUEUE_ELEMENT]: {
          "@mandatory": true,
          "@Common.ValueListWithFixedValues": true,
          "@Common.ValueList.$Type": "Common.ValueListType",
          "@Common.ValueList.CollectionPath": "PrintServiceQueues",
          "@Common.ValueList.Label": "{i18n>PRINT_QUEUES}",
          "@Common.ValueList.Parameters": [
            {
              $Type: "Common.ValueListParameterInOut",
              LocalDataProperty: QUEUE_ELEMENT,
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
        ...(numberOfFiles > 1
          ? {
              [FILE_ELEMENT]: {
                "@mandatory": true,
                "@Common.ValueListWithFixedValues": true,
                "@Common.ValueList.$Type": "Common.ValueListType",
                "@Common.ValueList.CollectionPath": "PrintServiceFiles",
                "@Common.ValueList.Parameters": [
                  {
                    $Type: "Common.ValueListParameterInOut",
                    LocalDataProperty: { "=": FILE_ELEMENT },
                    ValueListProperty: "property",
                  },
                  {
                    $Type: "Common.ValueListParameterDisplayOnly",
                    ValueListProperty: "fileName",
                  },
                  ...keys.map((key, i) => ({
                    $Type: "Common.ValueListParameterIn",
                    LocalDataProperty: { "=": `in/${key}` },
                    ValueListProperty: `entityKey${i + 1}`,
                  })),
                  {
                    $Type: "Common.ValueListParameterConstant",
                    ValueListProperty: "entity",
                    Constant: entityName,
                  },
                ],
                "@Common.Label": "{i18n>PRINT_FILE}",
                type: "cds.String",
              },
            }
          : {}),
      },
    };

    const serviceName = getMatchingService(m, entityName);

    entity["@UI.Identification"] ??= [];
    entity["@UI.Identification"].push({
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
        ID: { key: true, type: "cds.String", "@Common.Label": "{i18n>ID}" },
        description: { type: "cds.String", "@Common.Label": "{i18n>DESCRIPTION}" },
      },
    };

    if (numberOfFiles > 1)
      m.definitions[`${serviceName}.PrintServiceFiles`] = {
        [FILE_ENTITY]: true,
        kind: "entity",
        projection: {
          from: { ref: ["PrintService.Files"] },
        },
        elements: {
          entity: { key: true, type: "cds.String" },
          fileName: {
            type: "cds.String",
          },
          property: {
            key: true,
            type: "cds.String",
            "@Common.Text": { "=": "label" },
            "@Common.TextArrangement": { "#": "TextOnly" },
          },
          ...Object.entries(entity.elements)
            .filter(([, def]) => def.key)
            .map(([,], idx) => [`entityKey${idx + 1}`, { type: "cds.String" }])
            .reduce((acc, [name, def]) => {
              acc[name] = def;
              return acc;
            }, {}),
          label: { type: "cds.String" },
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
