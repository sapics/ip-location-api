declare namespace _exports {
    export { LookupResult };
}
declare namespace _exports {
    export { lookup };
    export { lookupNumber };
    export { lookupAny };
    export { setupWithoutReload };
    export { clear };
    export { reload };
    export { watchDb };
    export { stopWatchDb };
    export { updateDb };
}
export = _exports;
type LookupResult = {
    latitude?: number;
    longitude?: number;
    postcode?: string;
    area?: string;
    country?: string;
    eu?: boolean;
    region1?: string;
    region1_name?: string;
    region2?: string;
    region2_name?: string;
    metro?: number;
    timezone?: string;
    city?: string;
    country_name: string;
    country_native: string;
    continent: string;
    continent_name: string;
    capital: string;
    phone: number[];
    currency: string[];
    languages: string[];
};
/**
 * @typedef {Object} LookupResult
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {string} [postcode]
 * @property {string} [area]
 * @property {string} [country]
 * @property {boolean} [eu]
 * @property {string} [region1]
 * @property {string} [region1_name]
 * @property {string} [region2]
 * @property {string} [region2_name]
 * @property {number} [metro]
 * @property {string} [timezone]
 * @property {string} [city]
 * @property {string} country_name
 * @property {string} country_native
 * @property {string} continent
 * @property {string} continent_name
 * @property {string} capital
 * @property {number[]} phone
 * @property {string[]} currency
 * @property {string[]} languages
 */
/**
 * lookup ip address
 * @param {string} ip - ipv4 or ipv6 formatted address
 * @return {LookupResult | Promise<LookupResult | null> | null} location information
 */
declare function lookup(ip: string): LookupResult | Promise<LookupResult | null> | null;
/**
 * lookup ip address
 * @param {number | BigInt} ip - ipv4 or ipv6 numeric address
 * @return {LookupResult | Promise<LookupResult | null> | null} location information
 */
declare function lookupNumber(ip: number | bigint): LookupResult | Promise<LookupResult | null> | null;
/**
 * lookup ip address
 * @param {string | number | BigInt} ip - ipv4 or ipv6 formatted address or numeric address
 * @return {LookupResult | Promise<LookupResult | null> | null} location information
 */
declare function lookupAny(ip: string | number | bigint): LookupResult | Promise<LookupResult | null> | null;
/**
 * setup database without reload
 * @param {object} [_setting]
 * @return {void}
 */
declare const setupWithoutReload: (_setting?: {}) => void;
/**
 * clear in-memory database
 * @type {function}
 * @return {void}
 */
declare const clear: Function;
/**
 * reload in-memory database
 * @type {function}
 * @param {object} [_setting] - if you need to update the database with different setting
 * @param {boolean} [sync] - sync mode
 * @param {boolean} [_runningUpdate] - if it's running update [internal use]
 * @return {Promise|void}
 */
declare const reload: Function;
/**
 * Watch database directory.
 * When database file is updated, it reload the database automatically
 * This causes error if you use ILA_SMALL_MEMORY=true
 * @type {function}
 * @param {string} [name] - name of watch. If you want to watch multiple directories, you can set different name for each directory
 */
declare const watchDb: Function;
/**
 * Stop watching database directory
 * @type {function}
 * @param {string} [name]
 */
declare const stopWatchDb: Function;
/**
 * Update database and auto reload database
 * @type {function}
 * @param {object} [_setting] - if you need to update the database with different setting
 * @param {boolean} [noReload] - if you don't want to reload the database after update
 * @param {boolean} [sync] - if you want to update the database in sync mode
 * @return {Promise<boolean>} - true if database is updated, false if no need to update
 */
declare const updateDb: Function;
