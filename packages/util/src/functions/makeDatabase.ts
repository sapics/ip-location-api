/**
 * Creates or retrieves an entry in a database.
 * @param name - The name to store or retrieve
 * @param database - The database to use
 * @returns The index of the name in the database
 */
export function makeDatabase(name: string, database: Record<string, number>): number {
  if (database[name] === undefined) {
    database[name] = Object.keys(database).length
  }
  return database[name]
}
