const fieldsHoldingPrintConfig = new Map();
const annotatedParametersOfAction = new Map();

/**
 * This method captures annotated fields of an entity.
 * Fields of entity which are annotated to be used in specific action are stored in actionSpecificConfigFields.
 * Rest of the annotated fields are stored in genericConfigFields.
 * @param {Object} entity - The entity object containing elements to be processed.
 * @returns {Map} - A map containing the fields holding print configuration.
 */
const getFieldsHoldingPrintConfig = async function(entity) {
    const {genericConfigFields, actionSpecificConfigFields} = extractFieldsHoldingPrintConfig(entity.elements);
    if (Object.keys(genericConfigFields).length > 0 || Object.keys(actionSpecificConfigFields).length > 0) {
        fieldsHoldingPrintConfig.set(entity.name, {
            genericConfigFields,
            actionSpecificConfigFields
        });
    }
    return fieldsHoldingPrintConfig;
}

/**
 * This method captures annotated parameters of an action.
 * Current action's annotated parameters are stored in annotatedParametersOfAction.
 * If there are annotated fields to be used in this particular action, it is obtained from actionSpecificConfigFields and stored in annotatedParametersOfAction.
 * @param {Object} action - The action object containing parameters to be processed.
 * @returns {Map} - A map containing the annotated parameters of the action.
 */
const getAnnotatedParamsOfAction = async function(action) {
    const {genericConfigFields} = extractFieldsHoldingPrintConfig(action.params);
    const actionSpecificConfig = isAnnotatedFieldsSpecificForAction(fieldsHoldingPrintConfig.get(action.parent.name).actionSpecificConfigFields, action.name);
    annotatedParametersOfAction.set(action.name, {...genericConfigFields, ...actionSpecificConfig});
    return annotatedParametersOfAction;
}

/**
 * This method extracts annotated fields of an entity or an action.
 * @param {Object} elements - The elements of the entity or action to be processed.
 * @returns {Object} - An object containing genericConfigFields and actionSpecificConfigFields.
 */
function extractFieldsHoldingPrintConfig(elements) {
    const genericConfigFields = {};
    const actionSpecificConfigFields = {};
    let contentFieldsWithFileName = [];
    let actionSpecificContentFieldsWithFileName = [];
    
    for (const key in elements) {
        const element = elements[key];

        //Get genericConfigFields of the entity, i.e., not specific to an action
        if(element['@print.queue.SourceEntity'] && !element['@print.queue.usedInAction']) genericConfigFields.qNameField = element.name; //will be there if plain annotation
        if(element['@print.numberOfCopies'] && !element['@print.numberOfCopies.usedInAction']) genericConfigFields.numberOfCopiesField = element.name; //will be there if plain annotation
        if((element['@print.fileContent.fileNameField'] || element['@print.fileContent']) && !element['@print.fileContent.usedInAction']) {
            contentFieldsWithFileName.push({
                contentField: element.name,
                fileNameField: element['@print.fileContent.fileNameField'] ? element['@print.fileContent.fileNameField'] : '', //If fileNameField is not present, consider the content field as fileName
                isMainDocument: isAnnotatedWithMainDocument(element)
            })
        }
        genericConfigFields.contentFieldsWithFileName = contentFieldsWithFileName;
        
        // Get actionSpecificConfigFields of entity, i.e., to be used in specific action
        if(element['@print.queue.usedInAction']) actionSpecificConfigFields.qname = {
            field: element.name,
            usedInActions: element['@print.queue.usedInAction']
        }
        if(element['@print.numberOfCopies.usedInAction']) actionSpecificConfigFields.numberOfCopiesField = {
            field: element.name,
            usedInActions: element['@print.numberOfCopies.usedInAction']
        }
        
        if (element['@print.fileContent.usedInAction']) {
            actionSpecificContentFieldsWithFileName.push({
                contentField: element.name,
                fileNameField: element['@print.fileContent.fileNameField'] ? element['@print.fileContent.fileNameField'] : '', //Handle error if fileNameField is not present
                isMainDocument: isAnnotatedWithMainDocument(element),
                usedInActions: element['@print.fileContent.usedInAction']
            })
            actionSpecificConfigFields.contentFieldsWithFileName = actionSpecificContentFieldsWithFileName;
        }
    }

    return {
        genericConfigFields,
        actionSpecificConfigFields
    }  
}

/**
 * Annotated field names of entities are in the Map(fieldsHoldingPrintConfig).
 * Check if content is filled in those fields in the action -> check req context.
 * If not, check if those fields were populated by other post calls, by checking the entity via select query.
 * @param {Object} req - The request object containing target and event information.
 * @returns {Object} - An object containing qname, numberOfCopies, and docsToPrint.
 */
const getPrintConfigFromActionOrEntity = async function (req) {
    const annotatedEntityFields = fieldsHoldingPrintConfig.get(req.target.name).genericConfigFields; //annotated fields of entity
    const annotatedActionParams = annotatedParametersOfAction.get(req.event); //annotated params of action
    const entityDataOfAnnotatedFields = await SELECT.from(req.entity).where({ID: req.params[0].ID}); //Select on entity to get data of annotated fields

    const qname = getPrintQueueNameValue(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams);
    const numberOfCopies = getNumberOfCopiesValue(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams);
    const docsToPrint = await getContentToBePrinted(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams);
    
    return { qname, numberOfCopies, docsToPrint };
}

/**
 * This method retrieves the content to be printed.
 * @param {Object} req - The request object containing data.
 * @param {Object} entityDataOfAnnotatedFields - The data of annotated fields from the entity.
 * @param {Object} annotatedEntityFields - The annotated fields of the entity.
 * @param {Object} annotatedActionParams - The annotated parameters of the action.
 * @returns {Array} - An array of contents to be printed.
 */
async function getContentToBePrinted(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams) {
    let contentsToBePrinted = [];

    // Merge the content fields of entity & action; Multiple content fields can be annotated in entity and action
    const mergedContent = [
        ...(annotatedEntityFields?.contentFieldsWithFileName ?? []),
        ...(annotatedActionParams?.contentFieldsWithFileName ?? [])
    ];
    
    mergedContent.forEach(contentWithFileName => {
        // Iterate merged contents and check if the content-fields and fileName fields are filled.
        // Check for Main Document annotation and maintain accordingly

        if(!contentWithFileName.contentField || !contentWithFileName.fileNameField) {
            throw new Error('Print Configuration missing; Check if file content and fileName fields are maintained');
        }

        const content = req.data[contentWithFileName.contentField]
        ?? entityDataOfAnnotatedFields[0][contentWithFileName.contentField]
        const fileName = req.data[contentWithFileName.fileNameField]
        ?? entityDataOfAnnotatedFields[0][contentWithFileName.fileNameField]

        if (!content || !fileName) {
            throw new Error('Print Configuration missing; Check if file content and fileName fields are maintained');
        }

        contentsToBePrinted.push({
            content: content,
            fileName: fileName,
            isMainDocument: contentWithFileName.isMainDocument
        });
    })

    // Handle main document annotation error scenarios
    fileContentErrorHandling(contentsToBePrinted);
    return contentsToBePrinted;
}

/**
 * This method handles errors related to file content annotations.
 * @param {Array} contentFieldsArray - An array of content fields with file names.
 */
function fileContentErrorHandling(contentFieldsArray) {

    if(contentFieldsArray.length === 0) {
        throw new Error("No content fields found to print. Check if @print.fileContent annotation is maintained");
    }

    let hasMainDocument = false;
    let mainDocCount = 0;
    let nonMainDocCount = 0;
    contentFieldsArray.forEach(contentWithFileName => {
        if(contentWithFileName.isMainDocument) {
            hasMainDocument = true;
            mainDocCount++;
        } else {
            nonMainDocCount++;
        }
    })

    if (contentFieldsArray.length > 1) {
        if (!hasMainDocument) {
            throw new Error("At least one MainDocument annotation should be present");
        } if (mainDocCount > 1) {
            throw new Error("Multiple MainDocument annotations found in the entity");
        }
    } else if (contentFieldsArray.length === 1 && nonMainDocCount === 1) {
        // Default case: If there is one content field, with no main document annotation, it will be considered as main document
        contentFieldsArray[0].isMainDocument = true;
    }
}

/**
 * This method retrieves the print queue name value.
 * @param {Object} req - The request object containing data.
 * @param {Object} entityDataOfAnnotatedFields - The data of annotated fields from the entity.
 * @param {Object} annotatedEntityFields - The annotated fields of the entity.
 * @param {Object} annotatedActionParams - The annotated parameters of the action.
 * @returns {String} - The print queue name value.
 */
function getPrintQueueNameValue(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams) {
    // If @print.queue is annotated in entity field and action both places, throw error.
    if(annotatedEntityFields?.qNameField && annotatedActionParams?.qNameField) {
        throw new Error('Maintain @print.queue annotation in either entity or action, not both');
    }
    const qname = req.data?.[annotatedEntityFields?.qNameField]
    ?? req.data?.[annotatedActionParams?.qNameField] 
    ?? entityDataOfAnnotatedFields?.[0]?.[annotatedEntityFields?.qNameField]
    ?? entityDataOfAnnotatedFields?.[0]?.[annotatedActionParams?.qNameField]

    if(!qname) {
        throw new Error('Print Configuration missing; Check if @print.queue annotation is maintained or the annotated field is populated')
    }
    return qname;
}

/**
 * This method retrieves the number of copies value.
 * @param {Object} req - The request object containing data.
 * @param {Object} entityDataOfAnnotatedFields - The data of annotated fields from the entity.
 * @param {Object} annotatedEntityFields - The annotated fields of the entity.
 * @param {Object} annotatedActionParams - The annotated parameters of the action.
 * @returns {Number} - The number of copies value.
 */
function getNumberOfCopiesValue(req, entityDataOfAnnotatedFields, annotatedEntityFields, annotatedActionParams) {
    // If @print.numberOfCopies is annotated in entity field and action both places, throw error.
    if(annotatedEntityFields?.numberOfCopiesField && annotatedActionParams?.numberOfCopiesField) {
        throw new Error('Maintain @print.numberOfCopies annotation in either entity or action, not both');
    }
    const copies = req.data?.[annotatedEntityFields?.numberOfCopiesField]
    || req.data?.[annotatedActionParams?.numberOfCopiesField]
    || entityDataOfAnnotatedFields?.[0]?.[annotatedEntityFields?.numberOfCopiesField]

    if(!copies) {
        throw new Error('Print Configuration missing; Check if @print.numberOfCopies annotation is maintained or the annotated field is populated')
    }
    return copies;
}

/**
 * This method checks if an element is annotated with MainDocument.
 * @param {Object} element - The element to be checked.
 * @returns {Boolean} - True if the element is annotated with MainDocument, otherwise false.
 */
function isAnnotatedWithMainDocument(element) {
    if (element['@print.MainDocument'] && !element['@print.MainDocument.usedInAction']) {
        return true;
    }
    return false;
}

/**
 * This method checks if print specific fields are mentioned in an action as a parameters.
 * If yes, return those fields, so that they can be stored for future use during the action execution.
 * @param {Object} actionSpecificConfigFieldsOfEntity - The print-action-specific configuration fields of the entity.
 * @param {String} actionName - The name of the action.
 * @returns {Object} - An object containing the print-action-specific fields.
 */
function isAnnotatedFieldsSpecificForAction(actionSpecificConfigFieldsOfEntity, actionName) {
    const result = {};
    let contentFieldsWithFileName = [];

    if (actionSpecificConfigFieldsOfEntity.qname && actionSpecificConfigFieldsOfEntity.qname.usedInActions.includes(actionName)) {
        result.qNameField = actionSpecificConfigFieldsOfEntity.qname.field;
    }

    if (actionSpecificConfigFieldsOfEntity.numberOfCopiesField && actionSpecificConfigFieldsOfEntity.numberOfCopiesField.usedInActions.includes(actionName)) {
        result.numberOfCopiesField = actionSpecificConfigFieldsOfEntity.numberOfCopiesField.field;
    }

    if (actionSpecificConfigFieldsOfEntity.contentFieldsWithFileName) {
        actionSpecificConfigFieldsOfEntity.contentFieldsWithFileName.forEach(contentField => {
            if (contentField.usedInActions.includes(actionName)) {
                contentFieldsWithFileName.push({
                    contentField: contentField.contentField,
                    fileNameField: contentField.fileNameField,
                    isMainDocument: contentField.isMainDocument
                })
            }
        });
        result.contentFieldsWithFileName = contentFieldsWithFileName;
    }

    return result;
}

/**
 * This method retrieves the source entity name with the field annotated with @print.queue.
 * @param {Object} entity - The entity object to be processed.
 * @returns {String} - The queue value help entity.
 */
function getQueueValueHelpEntity(entity) {
    for (const key in entity) {
        const element = entity[key];
        if(element['@print.queue.SourceEntity']) {
            return element['@print.queue.SourceEntity'];
        }
    }
}

module.exports = {
    getFieldsHoldingPrintConfig,
    getAnnotatedParamsOfAction,
    getPrintConfigFromActionOrEntity,
    getQueueValueHelpEntity
}
