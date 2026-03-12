import { env } from '$env/dynamic/private';
import { create_db } from './create_db';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!env.DATABASE_AUTH_TOKEN) throw new Error('DATABASE_AUTH_TOKEN is not set');

export const db = create_db(env.DATABASE_URL, env.DATABASE_AUTH_TOKEN);
