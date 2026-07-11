## 🌐 EJS-Usuarios-Node-docker
Exemplo de Historico de Senhas em EJS e Node.js com banco de dados MongoDB. 

#### 🎨 Aqui está uma demonstração do projeto
<img width="600" height="350" alt="HistoricoSenha" src="https://github.com/user-attachments/assets/b038583e-ce9f-438f-9c8f-dcdb814ce4af" />

#### 📋 O que voçê vai ver nesse Projeto

| Tecnologia | Descrição |
|-----------|-----------|
| **EJS** |	Mecanismo de templates (view engine) para Node.js. |
| **Bcrypt** |   Algoritmo de hashing criptográfico utilizado para armazenar senhas de forma segura |
| **Express** | Framework web padrão e mais popular do Node.js |
| **Zod** |  Biblioteca de validação e declaração de esquemas para JavaScript e TypeScript |

#### 🔄 Executar a aplicação Docker
VSCode Terminal [1] Criar Container
```bash
docker-compose up --build
```

VSCode Terminal [3] Remover Container
```bash
docker compose down -v
```

#### 🔄 Executar a aplicação Desenvolvimento Local

VSCode Terminal [2] 
```bash
npm install
npm rum dev
```

Para acessar a aplicação **http://localhost:3333/index**

#### 🧪 Executar Endpoints 

|Método     | Caminho   | Descrição |
|-----------|-----------|-----------|
| **GET** | /users | Retorna todos os documentos de usuários na íntegra (apenas para demonstração) |
| **POST** | /users |Registra um novo usuário |
| **POST** | /users/login | Autentica um usuário |
| **PUT**  | /users/username/password | Altera a senha de um usuário |


- Consultar Usuarios 

```bash
json{
    "_id": "ObjectId(...)",
    "username": "usuarioteste",
    "password": "BCRYPT_HASH",
    "password_history": [
        { "password": "BCRYPT_HASH", "created_at": "ISODate(...)" }
    ],
    "created_at": "ISODate(...)",
    "updated_at": "ISODate(...)"
}
```

#### Separação de responsabilidades 
```bash
├── main.ts                  # Ponto de entrada do app Express, encerramento gracioso
├── tsconfig.json
├── package.json
├── libs/
│   ├── mongodb.ts           # MongoClient Singleton
│   └── validate.ts          # Fábrica de middleware de validação Zod
├── routes/
│   └── passwords.ts         # Todas as rotas da API, esquemas Zod e auxiliares bcrypt
```

 #### ⚙️ Zod Regras de Força de Senha 
- Aplicadas ao campo password no registro e ao campo new_password na alteração de senha:
- Mínimo de 8 caracteres 
- Pelo menos uma letra maiúscula (A-Z)
- Pelo menos uma letra minúscula (a-z) 
- Pelo menos um dígito (0-9)
- Pelo menos um caractere especial (qualquer um que não seja A-Za-z0-9)

