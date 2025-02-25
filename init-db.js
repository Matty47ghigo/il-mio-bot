const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Percorso del database
const dbPath = path.join(__dirname, 'data/warnings.db'); // Correggi il percorso qui
const db = new sqlite3.Database(dbPath);

// Crea la tabella warnings
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS warnings (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        mention TEXT,
        reason TEXT,
        warn_count INTEGER DEFAULT 0
    );
`;

db.run(createTableQuery, (err) => {
    if (err) {
        console.error('Errore durante la creazione della tabella:', err);
    } else {
        console.log('Tabella "warnings" creata con successo.');
    }
});

// Chiudi la connessione al database
db.close((err) => {
    if (err) {
        console.error('Errore durante la chiusura del database:', err);
    } else {
        console.log('Database inizializzato correttamente.');
    }
});