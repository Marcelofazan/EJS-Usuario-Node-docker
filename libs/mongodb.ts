import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_NAME as string;

// Validação Estrita das Variáveis de Ambiente
if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
}

if (!dbName) {
    throw new Error("MONGODB_DB_NAME is not defined in the environment variables");
}

/**
 * Retorna a instância do banco de dados reutilizando a conexão existente.
 * O maxPoolSize padrão de 100 é mantido para este servidor OLTP.
 */
let client: MongoClient | null = null;

export async function getClient(): Promise<MongoClient> {
    if (!client) {
        client = new MongoClient(uri, {
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000,
            serverSelectionTimeoutMS: 5000,
            appName: "devrel-github-typescript-passwordhistory"
        });
        await client.connect();
    }
    return client;
}

export async function getDb(): Promise<Db> {
    if (!dbInstance) {
        // Cria o cliente MongoDB apenas uma vez para o ciclo de vida do processo
        clientInstance = new MongoClient(uri); 
        await clientInstance.connect();
        
        // Conecta especificamente no banco de dados validado
        dbInstance = clientInstance.db(dbName);
        console.log(`🍃 Conexão Singleton estabelecida com sucesso no banco: "${dbName}"`);
    }
    return dbInstance;
}

/**
 * Fecha o pool de conexões de forma limpa durante o encerramento do servidor (SIGINT/SIGTERM)
 */
export async function closeConnection(): Promise<void> {
    if (clientInstance) {
        await clientInstance.close();
        clientInstance = null;
        dbInstance = null;
        console.log("🛑 Pool de conexões do MongoDB encerrado graciosamente.");
    }
}