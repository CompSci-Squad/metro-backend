# Configuração do ngrok para Integração com IA VIRAG-BIM

## O que é ngrok?

O ngrok cria um túnel seguro HTTPS que expõe sua API local para a internet, permitindo que a IA VIRAG-BIM se comunique com seu backend mesmo estando em desenvolvimento local.

## Instalação do ngrok

### Windows
\`\`\`powershell
# Via Chocolatey
choco install ngrok

# Ou baixe direto de https://ngrok.com/download
\`\`\`

### Mac/Linux
\`\`\`bash
# Via Homebrew (Mac)
brew install ngrok

# Ou baixe direto de https://ngrok.com/download
\`\`\`

## Configuração

### 1. Criar conta no ngrok
- Acesse https://dashboard.ngrok.com/signup
- Crie uma conta gratuita
- Copie seu authtoken do dashboard

### 2. Autenticar ngrok
\`\`\`bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
\`\`\`

### 3. Iniciar túnel
\`\`\`bash
# Expor porta 3000 (seu backend Node.js)
ngrok http 3000
\`\`\`

### 4. Copiar URL do túnel
Após executar o comando acima, você verá algo como:
\`\`\`
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
\`\`\`

### 5. Configurar .env
Copie a URL do ngrok e adicione no seu arquivo `.env`:

\`\`\`env
NGROK_URL=https://abc123.ngrok-free.app
VIRAG_API_KEY=sua_chave_api_aqui
\`\`\`

## Fluxo de Comunicação

\`\`\`
IA VIRAG-BIM (Servidor Remoto)
         ↓
    ngrok túnel (HTTPS)
         ↓
Backend Node.js (localhost:3000)
         ↓
PostgreSQL + LocalStack S3
\`\`\`

## Uso no Sistema

Todas as rotas que se conectam à IA usam a variável `NGROK_URL`:

- **Upload de BIM:** `POST ${NGROK_URL}/bim/upload-ifc`
- **Análise de Foto:** `POST ${NGROK_URL}/bim/analyze`
- **Health Check:** `GET ${NGROK_URL}/api/v1/health`

## Dicas Importantes

1. **URL Temporária:** A URL do ngrok muda toda vez que você reinicia o túnel (versão gratuita)
2. **Atualizar .env:** Sempre atualize a variável `NGROK_URL` no .env quando reiniciar o ngrok
3. **Manter Aberto:** Mantenha o terminal do ngrok aberto enquanto estiver testando
4. **Plano Pago:** Para URL fixa, considere o plano pago do ngrok

## Testando a Conexão

\`\`\`bash
# Verificar se ngrok está funcionando
curl https://your-ngrok-url.ngrok-free.app/api/v1/health

# Deve retornar status da API
\`\`\`

## Troubleshooting

### Erro: "tunnel not found"
- Verifique se o ngrok está rodando
- Confirme que a porta 3000 está correta

### Erro: "unauthorized"
- Verifique se adicionou o authtoken corretamente
- Execute: `ngrok config add-authtoken YOUR_TOKEN`

### Erro: "connection refused"
- Certifique-se que seu backend está rodando na porta 3000
- Verifique se não há firewall bloqueando

## Alternativas ao ngrok

- **localtunnel:** `npx localtunnel --port 3000`
- **serveo:** `ssh -R 80:localhost:3000 serveo.net`
- **cloudflared:** Cloudflare Tunnel (gratuito e com URL fixa)
