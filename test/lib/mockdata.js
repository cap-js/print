const elements_invoice = {
    ID: {
        key: true,
        type: "cds.UUID",
    },
    InvoiceNumber: {
        type: "cds.String",
    },
    attachment: {
        "@print.fileContent.fileNameField": "fileName",
        "@print.fileContent.usedInAction": [
            "releaseInvoice",
        ],
        type: "cds.LargeBinary",
    },
    attachmentName: {
        type: "cds.String",
    },
    fileContent: {
        "@print.fileContent.fileNameField": "fileName",
        "@print.fileContent.usedInAction": [
            "releaseInvoice",
        ],
        "@print.MainDocument": true,
        type: "cds.LargeBinary",
    },
    fileName: {
        type: "cds.String",
    },
    qName: {
        "@print.queue.usedInAction": [
            "releaseInvoice",
        ],
        "@print.queue.SourceEntity": "Queues",
        "@Common.ValueList.$Type": "Common.ValueListType",
        "@Common.ValueList.CollectionPath": "Queues",
        "@Common.ValueList.Parameters": [
            {
                $Type: "Common.ValueListParameterInOut",
                LocalDataProperty: {
                    "=": "qName_ID",
                },
                ValueListProperty: "ID",
            },
            {
                $Type: "Common.ValueListParameterDisplayOnly",
                ValueListProperty: "description",
            },
        ],
        "@Common.ValueListWithFixedValues": true,
        "@Common.Text": {
            "=": "qName.ID",
        },
        "@Common.Text.@UI.TextArrangement": {
            "#": "TextSeparate",
        },
        type: "cds.Association",
        cardinality: {
            max: 1,
        },
        target: "InvoiceService.Queues",
        keys: [
            {
                ref: [
                    "ID",
                ],
                $generatedFieldName: "qName_ID",
            },
        ],
    },
    qName_ID: {
        type: "cds.String",
        "@odata.foreignKey4": "qName",
        "@print.queue.usedInAction": [
            "releaseInvoice",
        ],
        "@print.queue.SourceEntity": "Queues",
        "@Common.ValueList.$Type": "Common.ValueListType",
        "@Common.ValueList.CollectionPath": "Queues",
        "@Common.ValueList.Parameters": [
            {
                $Type: "Common.ValueListParameterInOut",
                LocalDataProperty: {
                    "=": "qName_ID",
                },
                ValueListProperty: "ID",
            },
            {
                $Type: "Common.ValueListParameterDisplayOnly",
                ValueListProperty: "description",
            },
        ],
        "@Common.ValueListWithFixedValues": true,
        "@Common.Text": {
            "=": "qName.ID",
        },
        "@Common.Text.@UI.TextArrangement": {
            "#": "TextSeparate",
        },
        name: "qname",
    },
    numberOfCopies: {
        "@print.numberOfCopies.usedInAction": [
            "releaseInvoice",
        ],
        type: "cds.Integer",
        name: "numberOfCopies"
    },
    IsActiveEntity: {
        type: "cds.Boolean",
        key: true,
        default: {
            val: true,
        },
        "@UI.Hidden": true,
        virtual: true,
    },
    HasActiveEntity: {
        type: "cds.Boolean",
        default: {
            val: false,
        },
        notNull: true,
        "@UI.Hidden": true,
        virtual: true,
    },
    HasDraftEntity: {
        type: "cds.Boolean",
        default: {
            val: false,
        },
        notNull: true,
        "@UI.Hidden": true,
        virtual: true,
    },
    DraftAdministrativeData: {
        type: "cds.Association",
        target: "InvoiceService.DraftAdministrativeData",
        keys: [
            {
                ref: [
                    "DraftUUID",
                ],
                $generatedFieldName: "DraftAdministrativeData_DraftUUID",
            },
        ],
        cardinality: {
            max: 1,
        },
        "@odata.contained": true,
        "@UI.Hidden": true,
        virtual: true,
    },
    DraftAdministrativeData_DraftUUID: {
        type: "cds.UUID",
        "@odata.foreignKey4": "DraftAdministrativeData",
        "@odata.contained": true,
        "@UI.Hidden": true,
        virtual: true,
    },
    SiblingEntity: {
        type: "cds.Association",
        target: "InvoiceService.Invoice",
        cardinality: {
            max: 1,
        },
        on: [
            {
                ref: [
                    "SiblingEntity",
                    "ID",
                ],
            },
            "=",
            {
                ref: [
                    "ID",
                ],
            },
            "and",
            {
                ref: [
                    "SiblingEntity",
                    "IsActiveEntity",
                ],
            },
            "!=",
            {
                ref: [
                    "IsActiveEntity",
                ],
            },
        ],
    },
};

const actions_invoice = {
    noPrint: {
        kind: "action",
        params: {
            qnameID: {
                type: "cds.String",
            },
            numberOfCopies: {
                "@print.numberOfCopies": true,
                type: "cds.Integer",
            },
        },
    },
    releaseInvoice: {
        kind: "action",
        name: "releaseInvoice",
        parent: {
            name: "Invoice"
        },
        "@print": true,
        params: {
            qnameID: {
                "@print.queue.SourceEntity": "Queues",
                "@Common.ValueListWithFixedValues": true,
                "@Common.ValueList.$Type": "Common.ValueListType",
                "@Common.ValueList.CollectionPath": "Queues",
                "@Common.ValueList.Parameters": [
                    {
                        $Type: "Common.ValueListParameterInOut",
                        LocalDataProperty: {
                            "=": "qnameID",
                        },
                        ValueListProperty: "ID",
                    },
                ],
                "@Common.Label": "Print Queues",
                type: "cds.String",
                name: "qnameID"
            },
            numberOfCopies: {
                "@print.numberOfCopies": true,
                "@Common.Label": "Number of Copies",
                type: "cds.String",
                name: "numberOfCopies",
                field: "numberOfCopies"
            },
        },
    },
    draftPrepare: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
        params: {
            SideEffectsQualifier: {
                type: "cds.String",
            },
        },
    },
    draftActivate: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
    },
    draftEdit: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
        params: {
            PreserveChanges: {
                type: "cds.Boolean",
            },
        },
    },
};

const entity_invoice = {
    name: "Invoice",
    elements: elements_invoice,
    actions: actions_invoice,
    kind: "entity"
}

const elements_sales_order = {
    ID: {
        key: true,
        type: "cds.UUID",
    },
    OrderNumber: {
        type: "cds.String",
    },
    attachment: {
        "@print.fileContent.fileNameField": "fileName",
        type: "cds.LargeBinary",
    },
    attachmentName: {
        type: "cds.String",
    },
    fileContent: {
        "@print.fileContent.fileNameField": "fileName",
        "@print.MainDocument": true,
        type: "cds.LargeBinary",
    },
    fileName: {
        type: "cds.String",
    },
    qName: {
        "@print.queue.SourceEntity": "Queues",
        "@Common.ValueList.$Type": "Common.ValueListType",
        "@Common.ValueList.CollectionPath": "Queues",
        "@Common.ValueList.Parameters": [
            {
                $Type: "Common.ValueListParameterInOut",
                LocalDataProperty: {
                    "=": "qName_ID",
                },
                ValueListProperty: "ID",
            },
            {
                $Type: "Common.ValueListParameterDisplayOnly",
                ValueListProperty: "description",
            },
        ],
        "@Common.ValueListWithFixedValues": true,
        "@Common.Text": {
            "=": "qName.ID",
        },
        "@Common.Text.@UI.TextArrangement": {
            "#": "TextSeparate",
        },
        type: "cds.Association",
        cardinality: {
            max: 1,
        },
        target: "SalesOrder.Queues",
        keys: [
            {
                ref: [
                    "ID",
                ],
                $generatedFieldName: "qName_ID",
            },
        ],
    },
    qName_ID: {
        type: "cds.String",
        "@odata.foreignKey4": "qName",
        "@print.queue.SourceEntity": "Queues",
        "@Common.ValueList.$Type": "Common.ValueListType",
        "@Common.ValueList.CollectionPath": "Queues",
        "@Common.ValueList.Parameters": [
            {
                $Type: "Common.ValueListParameterInOut",
                LocalDataProperty: {
                    "=": "qName_ID",
                },
                ValueListProperty: "ID",
            },
            {
                $Type: "Common.ValueListParameterDisplayOnly",
                ValueListProperty: "description",
            },
        ],
        "@Common.ValueListWithFixedValues": true,
        "@Common.Text": {
            "=": "qName.ID",
        },
        "@Common.Text.@UI.TextArrangement": {
            "#": "TextSeparate",
        },
        name: "qName",
    },
    numberOfCopies: {
        "@print.numberOfCopies": true,
        type: "cds.Integer",
        name: "numberOfCopies"
    },
    IsActiveEntity: {
        type: "cds.Boolean",
        key: true,
        default: {
            val: true,
        },
        "@UI.Hidden": true,
        virtual: true,
    },
    HasActiveEntity: {
        type: "cds.Boolean",
        default: {
            val: false,
        },
        notNull: true,
        "@UI.Hidden": true,
        virtual: true,
    },
    HasDraftEntity: {
        type: "cds.Boolean",
        default: {
            val: false,
        },
        notNull: true,
        "@UI.Hidden": true,
        virtual: true,
    },
    DraftAdministrativeData: {
        type: "cds.Association",
        target: "InvoiceService.DraftAdministrativeData",
        keys: [
            {
                ref: [
                    "DraftUUID",
                ],
                $generatedFieldName: "DraftAdministrativeData_DraftUUID",
            },
        ],
        cardinality: {
            max: 1,
        },
        "@odata.contained": true,
        "@UI.Hidden": true,
        virtual: true,
    },
    DraftAdministrativeData_DraftUUID: {
        type: "cds.UUID",
        "@odata.foreignKey4": "DraftAdministrativeData",
        "@odata.contained": true,
        "@UI.Hidden": true,
        virtual: true,
    },
    SiblingEntity: {
        type: "cds.Association",
        target: "SalesOrderService.SalesOrder",
        cardinality: {
            max: 1,
        },
        on: [
            {
                ref: [
                    "SiblingEntity",
                    "ID",
                ],
            },
            "=",
            {
                ref: [
                    "ID",
                ],
            },
            "and",
            {
                ref: [
                    "SiblingEntity",
                    "IsActiveEntity",
                ],
            },
            "!=",
            {
                ref: [
                    "IsActiveEntity",
                ],
            },
        ],
    },
};

const actions_sales_order = {
    noPrint: {
        kind: "action",
        params: {
            qnameID: {
                type: "cds.String",
            },
            numberOfCopies: {
                "@print.numberOfCopies": true,
                type: "cds.Integer",
            },
        },
    },

    releaseSalesOrder: {
        kind: "action",
        "@print": true,
        params: {
            qnameID: {
                "@print.queue.SourceEntity": "Queues",
                "@Common.ValueListWithFixedValues": true,
                "@Common.ValueList.$Type": "Common.ValueListType",
                "@Common.ValueList.CollectionPath": "Queues",
                "@Common.ValueList.Parameters": [
                    {
                        $Type: "Common.ValueListParameterInOut",
                        LocalDataProperty: {
                            "=": "qnameID",
                        },
                        ValueListProperty: "ID",
                    },
                ],
                "@Common.Label": "Print Queues",
                type: "cds.String",
            },
            numberOfCopies: {
                "@print.numberOfCopies": true,
                "@Common.Label": "Number of Copies",
                type: "cds.String",
            },
        },
    },
    draftPrepare: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
        params: {
            SideEffectsQualifier: {
                type: "cds.String",
            },
        },
    },
    draftActivate: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
    },
    draftEdit: {
        kind: "action",
        returns: {
            type: "InvoiceService.Invoice",
        },
        params: {
            PreserveChanges: {
                type: "cds.Boolean",
            },
        },
    },
};

const entity_sales_order = {
    name: "SalesOrder",
    elements: elements_sales_order,
    actions: actions_sales_order,
    kind: "entity"
}

module.exports = { entity_invoice, entity_sales_order };