require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.json()); // parse JSON
app.use(cors());
app.use(express.static("public")); // sert ton frontend depuis /public

// ==================== CONFIGURATION AZURE SQL ====================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === "true"
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// ==================== POOL GLOBAL ====================
let poolPromise;

async function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(dbConfig)
            .then(pool => {
                console.log("? Connecté à Azure SQL Database !");
                pool.on('error', err => {
                    console.error("? Erreur pool SQL :", err);
                    poolPromise = null;
                });
                return pool;
            })
            .catch(err => {
                console.error("? Erreur connexion SQL :", err);
                poolPromise = null;
                throw err;
            });
    }
    return poolPromise;
}
getPool(); // tester la connexion au démarrage

// ==================== ROUTES API ====================

// GET - récupérer tous les formulaires
app.get('/api/formulaires', async (req, res) => {
    try {
        const pool = await getPool();
        const query = `
            SELECT id, nom, email, telephone, message, date_creation
            FROM contact
            ORDER BY date_creation DESC
        `;
        const result = await pool.request().query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("? Erreur SELECT :", err);
        res.status(500).json({ success: false, error: "Erreur lors de la récupération des données" });
    }
});

// POST - créer un nouveau formulaire
app.post('/api/formulaires', async (req, res) => {
    try {
        const { nom, email, telephone, message } = req.body;

        if (!nom || !email) {
            return res.status(400).json({ success: false, error: "Nom et email requis" });
        }

        const pool = await getPool();
        await pool.request()
            .input('nom', sql.NVarChar(100), nom)
            .input('email', sql.NVarChar(100), email)
            .input('telephone', sql.NVarChar(50), telephone || null)
            .input('message', sql.NVarChar(sql.MAX), message || null) // <-- message bien pris en compte
            .query("INSERT INTO contact (nom, email, telephone, message) VALUES (@nom, @email, @telephone, @message)");

        res.json({ success: true, message: "Formulaire enregistré avec succès" });
    } catch (err) {
        console.error("? Erreur INSERT :", err);
        res.status(500).json({ success: false, error: "Erreur lors de l'enregistrement" });
    }
});

// DELETE - supprimer un formulaire par ID
app.delete('/api/formulaires/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ success: false, error: "ID invalide" });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM contact WHERE id=@id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, error: "Element non trouvé" });
        }

        res.json({ success: true, message: "Element supprimé avec succès" });
    } catch (err) {
        console.error("? Erreur DELETE :", err);
        res.status(500).json({ success: false, error: "Erreur lors de la suppression" });
    }
});

// ==================== DÉMARRAGE SERVEUR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`?? Backend Node.js en cours d'exécution sur http://localhost:${PORT}`);
    console.log(`?? API disponible sur http://localhost:${PORT}/api/formulaires`);
});
