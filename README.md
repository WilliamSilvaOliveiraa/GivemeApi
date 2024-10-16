# API REST de Upload de Arquivos com Autenticação

Esta API, desenvolvida em Node.js com Express, oferece um sistema de autenticação e upload de arquivos para o Google Drive. Ela utiliza um banco de dados MongoDB para armazenamento de usuários e inclui funcionalidades de autenticação com refresh token.

## Características Principais

- Autenticação de usuários com geração de tokens
- Integração com a API do Google Drive para armazenamento de arquivos
- Upload de até 3 arquivos por usuário para o Google Drive
- Geração de links públicos para visualização dos arquivos enviados
- Utilização de banco de dados MongoDB para armazenamento de dados
- Middleware de autenticação para verificação de tokens
- Bcrypt hash para criptografia de senhas

## Estrutura do Projeto

```
GivemeApi/
├── config/
│   ├── googleConfig.js
│   └── dbConfig.js
├── controllers/
├── middleware/
│   └── authMiddleware.js
├── models/
├── routes/
├── utils/
├── index.js
├── .env
└── package.json
```

## Pré-requisitos

- Node.js
- MongoDB/Mongoose
- Conta no Google Cloud Platform com a API do Google Drive habilitada e configurada

## Configuração

1. Clone o repositório:
   ```
   git clone https://github.com/WilliamSilvaOliveiraa/GivemeApi
   ```

2. Instale as dependências:
   ```
   yarn || npm install
   ```

3. Configure as variáveis de ambiente em um arquivo `.env`:
   ```
   CLIENT_ID = api_google_cloud_client_id
   CLIENT_SECRET = api_google_cloud_client_secret
   REDIRECT_URI = http://localhost:(Port)/google/handleCallback || Rota de callback da api do google drive
   SECRET = sua_secret
   PORT = sua_porta_da_url
   DB_USER = seu_db_user
   DB_PASS = sua_db_password
   ```

4. Inicie o servidor:
   ```
   yarn dev || npm run dev
   ```

## Uso

### Autenticação

- `POST /auth/register`: Registra um novo usuário, autentica e retorna os tokens de acesso
- `POST /auth/login`: Realiza login e retorna tokens de acesso
- `POST /auth/logout`: Realiza o logout e remove os tokens de acesso

### Upload de Arquivos

- `POST /file/upload`: Faz upload de até 3 arquivos para o Google Drive (requer autenticação)
- `GET /file/public-url/:fileId`: Gera um link público do arquivo que foi dado o upload (requer autenticação)

### Gerenciamento de Arquivos

- `GET /user/getList/:id`: Lista os arquivos do usuário (requer autenticação)
- `DELETE /file/delete/:fileId`: Remove um arquivo específico (requer autenticação)

## Segurança

- Senhas são armazenadas com hash
- Autenticação baseada em tokens JWT
- Middleware de autenticação para proteger rotas sensíveis

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
