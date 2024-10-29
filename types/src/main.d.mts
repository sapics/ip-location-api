import type { ICountry, TContinentCode, TContinents, TCountryCode } from "countries-list";

export type LookupResult = {
	latitude?: number;
	longitude?: number;
	postcode?: string;
	area?: string;
	country?: TCountryCode;
	eu?: boolean;
	region1?: string;
	region1_name?: string;
	region2?: string;
	region2_name?: string;
	metro?: number;
	timezone?: string;
	city?: string;

	country_name: ICountry["name"];
	country_native: ICountry["native"];
	continent: ICountry["continent"];
	continent_name: TContinents[TContinentCode];
	capital: ICountry["capital"];
	phone: ICountry["phone"];
	currency: ICountry["currency"];
	languages: ICountry["languages"];
};

/**
 * lookup ip address [Sync / Async]
 * @param {string} ip - ipv4 or ipv6 formatted address
 * @return location information as either object or promise (based on settings), or null if not found.
 */
export const lookup: (ip: string) => LookupResult | Promise<LookupResult | null> | null;
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
