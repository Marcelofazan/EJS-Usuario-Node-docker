import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { getDb, closeConnection } from "./libs/mongodb";
import passwordRouter from "./routes/passwords";

const app = express();
// Alterado para 3333 como padrão caso não esteja configurado no seu .env
const PORT = process.env.PORT ?? 3333; 

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'views'));

// ================= ROTAS DE NAVEGAÇÃO DO FRONTEND =================

// Corrigido: Adicionado a "/" antes do index e enviando a propriedade 'page'
app.get("/index", (_req, res) => {
    res.render("index", { page: "login" });
});

app.get("/register", (_req, res) => {
    res.render("index", { page: "register" });
});

app.get("/change-password", (_req, res) => {
    res.render("index", { page: "change-password" });
});

app.get("/users-list", (_req, res) => {
    res.render("index", { page: "users-list" });
});

// Redireciona a rota raiz para o /index por conveniência
app.get("/", (_req, res) => {
    res.redirect("/index");
});

// ==================================================================

// Suas rotas de API existentes
app.use("/users", passwordRouter);

async function start() {
    const db = await getDb();
    await db.collection("users").createIndex({ username: 1 }, { unique: true });

    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    process.on("SIGTERM", async () => {
        console.log("SIGTERM received, shutting down gracefully...");
        server.close(async () => {
            await closeConnection();
            process.exit(0);
        });
    });

    process.on("SIGINT", async () => {
        console.log("SIGINT received, shutting down gracefully...");
        server.close(async () => {
            await closeConnection();
            process.exit(0);
        });
    });
}

start();