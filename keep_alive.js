const express = require('express');

// Configurazione del server Express per il keep-alive
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Il bot è attivo!');
});

app.listen(port, () => {
    console.log(`Server HTTP in esecuzione su http://localhost:${port}`);
});
