import type { IpLocationApiSettings } from '../getSettings.js'
import type { LocationData } from './createDatabase.js'

/**
 * Creates a block database from the provided file and location data.
 * @param file - The file path of the block database CSV
 * @param locationData - Array of location data records
 * @param locationIdList - List of location IDs to process
 * @param settings - IP location API settings
 */
export async function createBlockDatabase(file: string, locationData: Record<number, LocationData | string>[], locationIdList: number[], settings: IpLocationApiSettings): Promise<void> {
  const version = file.endsWith('v4.csv') ? 4 : 6
  //* TODO: Implement the block database creation logic
  console.log(`Creating block database for IP${version}...`)
}
