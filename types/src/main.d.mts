export function lookup(ip: string): LookupResult | Promise<LookupResult | null> | null;
export function lookupNumber(ip: number | bigint): LookupResult | Promise<LookupResult | null> | null;
export function lookupAny(ip: string | number | bigint): LookupResult | Promise<LookupResult | null> | null;
/**
 * setup database without reload
 * @param {object} [_setting]
 * @return {void}
 */
export const setupWithoutReload: (_setting?: {}) => void;
/**
 * clear in-memory database
 * @type {function}
 * @return {void}
 */
export const clear: Function;
/**
 * reload in-memory database
 * @type {function}
 * @param {object} [_setting] - if you need to update the database with different setting
 * @param {boolean} [sync] - sync mode
 * @param {boolean} [_runningUpdate] - if it's running update [internal use]
 * @return {Promise|void}
 */
export const reload: Function;
/**
 * Watch database directory.
 * When database file is updated, it reload the database automatically
 * This causes error if you use ILA_SMALL_MEMORY=true
 * @type {function}
 * @param {string} [name] - name of watch. If you want to watch multiple directories, you can set different name for each directory
 */
export const watchDb: Function;
/**
 * Stop watching database directory
 * @type {function}
 * @param {string} [name]
 */
export const stopWatchDb: Function;
/**
 * Update database and auto reload database
 * @type {function}
 * @param {object} [_setting] - if you need to update the database with different setting
 * @param {boolean} [noReload] - if you don't want to reload the database after update
 * @param {boolean} [sync] - if you want to update the database in sync mode
 * @return {Promise<boolean>} - true if database is updated, false if no need to update
 */
export const updateDb: Function;
export type LookupResult = {
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
