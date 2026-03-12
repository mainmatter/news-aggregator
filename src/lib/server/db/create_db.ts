import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

export const create_db = (database_url: string, database_auth_token: string) => {
	const client = createClient({ url: database_url, authToken: database_auth_token });

	return drizzle(client, { schema });
};

export type Database = ReturnType<typeof create_db>;
