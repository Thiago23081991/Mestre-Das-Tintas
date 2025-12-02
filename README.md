# Mestre das Cores - Suvinil 🎨

Aplicação gamificada para treinamento de Operação Tonalidade da Suvinil.

## Tecnologias

- **React** (Frontend)
- **Vite** (Build Tool)
- **TypeScript**
- **Tailwind CSS** (Estilização)
- **Google Gemini API** (IA para geração de casos)
- **Supabase** (Banco de dados para ranking e histórico)

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com suas chaves (opcional, pois o projeto tem fallbacks):
   ```
   API_KEY=sua_chave_gemini
   SUPABASE_URL=sua_url_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   ```

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Deploy

Este projeto está configurado para deploy fácil na **Vercel**. Basta conectar o repositório GitHub.
