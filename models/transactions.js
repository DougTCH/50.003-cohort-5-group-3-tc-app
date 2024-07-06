class TransactionRecord{
    static createTable(){
        return `CREATE TABLE IF NOT EXISTS users (
            hashed_id TEXT NOT NULL UNIQUE,
            hashed_pw TEXT NOT NULL
        );`;
    }

}