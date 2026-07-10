import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getDb } from "../libs/mongodb";
import { MongoServerError } from "mongodb";
import { validate } from "../libs/validate";

const SALT_ROUNDS = 12;

type PasswordHistoryEntry = {
    password: string;
    created_at: Date;
};

type UserDocument = {
    username: string;
    password: string;
    password_history: PasswordHistoryEntry[];
    created_at: Date;
    updated_at: Date;
};

async function hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
}

async function isPasswordInHistory(
    plaintext: string,
    history: PasswordHistoryEntry[]
): Promise<boolean> {
    for (const entry of history) {
        const match = await bcrypt.compare(plaintext, entry.password);
        if (match) return true;
    }
    return false;
}
const router = Router();

/**
 * Regras de força de senha:
 *  - Mínimo 8 caracteres
 *  - Pelo menos uma letra maiúscula
 *  - Pelo menos uma letra minúscula
 *  - Pelo menos um dígito
 *  - Pelo menos um caractere especial
 */
const strongPasswordSchema = z
    .string()
    .min(8, "A senha deve conter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial");

const registerSchema = z.object({
    username: z.string().min(1, "O nome de usuário é obrigatório").trim(),
    password: strongPasswordSchema,
});

const loginSchema = z.object({
    username: z.string().min(1, "O nome de usuário é obrigatório").trim(),
    password: z.string().min(1, "A senha é obrigatória"),
});

const changePasswordSchema = z.object({
    current_password: z.string().min(1, "A senha atual é obrigatória"),
    new_password: strongPasswordSchema,
});

// GET /users — Listar todos os usuários com seus documentos completos (apenas demonstração)
router.get("/", async (_req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const users = await db.collection<UserDocument>("users").find({}).toArray();
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// POST /users — Registrar um novo usuário
router.post("/", validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
        const db = await getDb();
        const hashed = await hashPassword(password);
        const now = new Date();

        await db.collection("users").insertOne({
            username,
            password: hashed,
            password_history: [{ password: hashed, created_at: now }],
            created_at: now,
            updated_at: now,
        });

        res.status(201).json({ message: "Usuário criado com sucesso" });
    } catch (err) {
        if (err instanceof MongoServerError && err.code === 11000) {
            res.status(409).json({ error: "Este nome de usuário já existe" });
            return;
        }
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// POST /users/login — Autenticar um usuário
router.post("/login", validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
        const db = await getDb();
        const users = db.collection<UserDocument>("users");

        const user = await users.findOne({ username });
        if (!user) {
            res.status(401).json({ error: "Credenciais inválidas" });
            return;
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
            res.status(401).json({ error: "Credenciais inválidas" });
            return;
        }

        res.status(200).json({ message: "Login realizado com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

// PUT /users/:username/password — Alterar a senha de um usuário
router.put("/:username/password", validate(changePasswordSchema), async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    const { current_password, new_password } = req.body;

    try {
        const db = await getDb();
        const users = db.collection<UserDocument>("users");

        const user = await users.findOne({ username });
        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }

        const currentValid = await verifyPassword(current_password, user.password);
        if (!currentValid) {
            res.status(401).json({ error: "A senha atual está incorreta" });
            return;
        }

        const history = user.password_history ?? [];

        const alreadyUsed = await isPasswordInHistory(new_password, history);
        if (alreadyUsed) {
            res.status(409).json({ error: "A nova senha já foi utilizada anteriormente. Por favor, escolha uma senha diferente." });
            return;
        }

        const hashed = await hashPassword(new_password);
        const now = new Date();

        await users.updateOne(
            { username },
            {
                $set: {
                    password: hashed,
                    updated_at: now,
                },
                $push: {
                    password_history: { password: hashed, created_at: now },
                },
            }
        );

        res.status(200).json({ message: "Senha atualizada com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

export default router;