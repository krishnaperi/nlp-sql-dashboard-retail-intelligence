import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';

let connectionPool: snowflake.Connection | null = null;

function getConnection(): Promise<snowflake.Connection> {
    return new Promise((resolve, reject) => {
        if (connectionPool && connectionPool.isUp()) {
            resolve(connectionPool);
            return;
        }

        // Key-pair auth bypasses MFA for programmatic access
        let privateKey = process.env.SNOWFLAKE_PRIVATE_KEY;

        if (!privateKey) {
            try {
                const privateKeyPath = path.join(process.cwd(), 'snowflake_rsa_key.p8');
                privateKey = fs.readFileSync(privateKeyPath, 'utf8');
            } catch (err) {
                reject(new Error("SNOWFLAKE_PRIVATE_KEY environment variable is missing and local .p8 file was not found."));
                return;
            }
        }

        // Use the raw private key string directly, this matches the working test script
        if (privateKey) {
            // Check if the key is a base64 encoded string (no spaces, newlines, or headers)
            // This is the safest way to pass multi-line RSA keys through Vercel's UI
            if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('\\n')) {
                try {
                    privateKey = Buffer.from(privateKey.trim(), 'base64').toString('utf8');
                } catch (e) {
                    console.error('Failed to decode base64 private key:', e);
                }
            } else {
                // Fallback for local testing or if passing a raw string
                privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
                if (!privateKey.includes('\n')) {
                    privateKey = privateKey
                        .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
                        .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
                }
            }
        }

        const conn = snowflake.createConnection({
            account: process.env.SNOWFLAKE_ACCOUNT || '',
            username: process.env.SNOWFLAKE_USERNAME || '',
            authenticator: 'SNOWFLAKE_JWT',
            privateKey: privateKey,
            database: process.env.SNOWFLAKE_DATABASE || 'ONSITE_SEARCH',
            schema: process.env.SNOWFLAKE_SCHEMA || 'PUBLIC',
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'SNOWQUERY_WH',
        });

        conn.connect((err) => {
            if (err) {
                console.error('Snowflake connection error:', err);
                reject(err);
            } else {
                connectionPool = conn;
                resolve(conn);
            }
        });
    });
}

export async function executeQuery(sql: string): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    const conn = await getConnection();

    return new Promise((resolve, reject) => {
        conn.execute({
            sqlText: sql,
            complete: (err, stmt, rows) => {
                if (err) {
                    reject(new Error(`Query execution failed: ${err.message}`));
                    return;
                }

                if (!rows || rows.length === 0) {
                    resolve({ columns: [], rows: [] });
                    return;
                }

                const columns = Object.keys(rows[0] as Record<string, unknown>);
                resolve({
                    columns,
                    rows: rows as Record<string, unknown>[],
                });
            },
        });
    });
}

export async function getTableSchema(): Promise<{ tables: { name: string; columns: { name: string; type: string }[] }[] }> {
    const dbName = process.env.SNOWFLAKE_DATABASE || 'ONSITE_SEARCH';
    const schemaName = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';

    const sql = `
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM ${dbName}.INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${schemaName}'
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `;

    const { rows } = await executeQuery(sql);

    const tableMap = new Map<string, { name: string; type: string }[]>();
    for (const row of rows) {
        const tableName = String(row.TABLE_NAME);
        const colName = String(row.COLUMN_NAME);
        const dataType = String(row.DATA_TYPE);

        if (!tableMap.has(tableName)) {
            tableMap.set(tableName, []);
        }
        tableMap.get(tableName)!.push({ name: colName, type: dataType });
    }

    return {
        tables: Array.from(tableMap.entries()).map(([name, columns]) => ({
            name,
            columns,
        })),
    };
}
