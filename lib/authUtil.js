// Include SAP Cloud SDK reuse functions for JWT decoding and other SAP services
const { decodeJwt } = require('@sap-cloud-sdk/connectivity');
const cds = require('@sap/cds');
const logger = cds.log("print");
const xssec = require('@sap/xssec');


// Map to store JWTs and an array to keep track of subdomains for FIFO
const jwtStore = new Map();
const fifoQueue = [];
const maxTenants = 50;

/**
 * Reads the VCAP services to get the service credentials for the print service.
 * @returns {Object|undefined} - The service credentials or undefined if not found.
 */
async function readVcapServices(req) {
    let serviceCredentials;
    try {
        // Load service credentials using the tag 'Print'
        serviceCredentials = cds.env.requires.print.credentials;
        return serviceCredentials;
    } catch (e) {
        // Handle case where print service is not found (development vs production)
        logger.error('Print service not found');
        if (process.env.NODE_ENV === 'production') {
            logger.error('Print service must be present in production');
            return req.error(500, 'Print service not found');
        }
        return;
    }
}

/**
 * Retrieves the JWT token for the print service authorization.
 * @param {Object} req - The request object.
 * @param {Object} svc - The service credentials.
 * @returns {String|undefined} - The JWT token or undefined if an error occurs.
 */
async function getJwt(req, svc) {
    const subscriberDomain = cds.context.http.req?.authInfo?.getSubdomain() || process.env.SUBSCRIBER_SUBDOMAIN_FOR_LOCAL_TESTING;
    if (!subscriberDomain) {
        return req.error(500, 'Failed to retrieve subscriber domain');
    }

    // Check if a valid JWT exists in the store
    let jwt = jwtStore.get(subscriberDomain);
    if (jwt) {
        const { exp } = decodeJwt(jwt);
        const currentTime = Math.floor(Date.now() / 1000);

        if (exp >= currentTime) {
            logger.info(`JWT for subdomain ${subscriberDomain} retrieved from cache.`);
            return jwt;
        }

        // If JWT is expired, remove it
        jwtStore.delete(subscriberDomain);
        fifoQueue.splice(fifoQueue.indexOf(subscriberDomain), 1);
        logger.info(`Expired JWT for subdomain ${subscriberDomain} deleted from cache.`);
    }

    // Request a new JWT if none exists or the existing one is expired
    try {
        jwt = await new Promise((resolve, reject) => {
            xssec.requests.requestClientCredentialsToken(
                subscriberDomain,
                svc.uaa,
                null,
                '',
                (err, token) => (err ? reject(err) : resolve(token))
            );
        });

        // Store the new JWT and manage the FIFO queue
        jwtStore.set(subscriberDomain, jwt);
        fifoQueue.push(subscriberDomain);

        if (fifoQueue.length > maxTenants) {
            const oldestSubdomain = fifoQueue.shift();
            jwtStore.delete(oldestSubdomain);
        }

        logger.info('JWT retrieved and stored (subdomain):', {
            tenant: decodeJwt(jwt)?.zid,
            scope: decodeJwt(jwt)?.scope,
            subdomain: decodeJwt(jwt)?.ext_attr?.zdn,
        });

        return jwt;
    } catch (err) {
        logger.error('Error retrieving JWT (subdomain):', err.message);
        return req.error(500, 'Error retrieving JWT for subdomain');
    }
}


module.exports = {
    getJwt,
    readVcapServices
};


