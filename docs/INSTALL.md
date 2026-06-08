# Guia de Instalação — NexusOps

> Guia passo-a-passo para utilizadores **completamente leigos**.
> Assume que só sabes usar o ambiente gráfico (Explorador, browser, Bloco de Notas).
> Quando for necessário abrir uma linha de comando, está claramente indicado.

Para utilizadores avançados, ver [DEPLOY.md](DEPLOY.md).

---

## O que vais instalar

1. **Docker Desktop** — ferramenta que corre o NexusOps em contentores isolados
2. **Git** — para descarregar o código do GitHub
3. **NexusOps** — o projecto em si

Tempo estimado: **15 a 20 minutos** (a maior parte é só esperar downloads).

Sistema operativo assumido: **Windows 10/11**.

---

## PASSO 1 — Instalar Docker Desktop

1. Vai a **https://www.docker.com/products/docker-desktop/**
2. Clica em **"Download for Windows"** (botão azul grande)
3. Quando o ficheiro `Docker Desktop Installer.exe` terminar de descarregar, **duplo-clique** para abrir
4. Aceita os termos e clica **"OK"** em todos os ecrãs (deixa as opções por defeito)
5. Quando pedir, **reinicia o computador**
6. Depois do reinício, vai abrir-se uma janela "Docker Desktop" — aceita os termos e clica **"Accept"**
7. Pode pedir-te para criar conta — podes **saltar** (clica "Continue without signing in")
8. **Aguarda** até apareceres o ícone da baleia 🐳 verde no canto inferior direito (barra de tarefas, perto do relógio) — pode demorar 1-2 minutos

> **Como sabes que está pronto?** O ícone da baleia 🐳 fica fixo (não animado) e ao passar o rato diz "Docker Desktop is running".

---

## PASSO 2 — Instalar Git

1. Vai a **https://git-scm.com/download/win**
2. O download começa automaticamente — abre o ficheiro `.exe` que foi descarregado
3. Clica **"Next"** em todos os ecrãs (deixa tudo por defeito)
4. No fim, clica **"Finish"**

---

## PASSO 3 — Descarregar o projecto do GitHub

1. **Abre o Explorador de Ficheiros** (a pasta amarela na barra de tarefas)
2. Vai para a pasta onde queres ter o projecto (ex: `Documentos`)
3. Cria uma nova pasta — ex: `Projectos` (clica direito → Novo → Pasta)
4. **Entra na pasta `Projectos`**
5. **Linha de comando necessária aqui:** Na barra de endereço do Explorador (em cima, onde aparece o caminho), **clica e escreve**:
   ```
   cmd
   ```
   e prime **Enter**
6. Abre-se uma **janela preta** (Command Prompt) já na pasta certa
7. **Copia e cola** este comando (clica direito na janela preta para colar):
   ```
   git clone https://github.com/jotaccf/nexusops.git
   ```
8. Prime **Enter** e aguarda — vai aparecer várias linhas a indicar download
9. Quando aparecer o prompt novamente (linha a piscar), está feito

---

## PASSO 4 — Configurar passwords

1. **Volta ao Explorador de Ficheiros** — vais ver uma nova pasta `nexusops` dentro de `Projectos`
2. **Entra em `nexusops`**
3. Procura o ficheiro **`.env.example`**

   > Se não vires ficheiros que começam por ponto: no Explorador, vai a **Ver** (menu de cima) → **Mostrar** → ✅ **Itens ocultos**

4. **Copia** o `.env.example` (Ctrl+C) e **cola** na mesma pasta (Ctrl+V) — fica `.env.example - Cópia`
5. **Renomeia** essa cópia para apenas **`.env`** (sem nada à frente, sem extensão)
6. Clica direito em `.env` → **Abrir com** → **Bloco de Notas**
7. Vais ver isto:
   ```
   POSTGRES_PASSWORD=ALTERAR_ESTA_PASSWORD
   JWT_SECRET=ALTERAR_ESTE_SECRET_MINIMO_32_CARACTERES
   ```
8. **Substitui** os valores:
   - `POSTGRES_PASSWORD` → escolhe uma password forte, ex: `MinhaP@ssw0rd2026!`
   - `JWT_SECRET` → escreve uma frase comprida aleatória, ex: `o-meu-segredo-super-secreto-para-nexusops-2026-mudar-isto-em-producao`
9. **Guarda** (Ctrl+S) e fecha o Bloco de Notas

---

## PASSO 5 — Arrancar o NexusOps

1. **Volta à janela preta (Command Prompt)** que tinhas aberto no Passo 3

   > Se a fechaste, abre o Explorador na pasta `nexusops`, escreve `cmd` na barra de endereço e prime Enter

2. Garante que estás dentro da pasta `nexusops` — escreve:
   ```
   cd nexusops
   ```
   e prime Enter (se já estás dentro, vai dizer "sistema não consegue encontrar o caminho" — ignora)

3. **Copia e cola** este comando:
   ```
   docker compose up -d --build
   ```
4. Prime **Enter**

5. **Vai demorar 3 a 5 minutos** na primeira vez (descarrega ~500MB e compila o projecto). Vais ver muito texto a aparecer — é normal. Não feches a janela.

6. Quando voltar o prompt (linha a piscar com `C:\...\nexusops>`), está pronto. As últimas linhas devem dizer algo como:
   ```
   Container nexusops_postgres Started
   Container nexusops_app Started
   ```

---

## PASSO 6 — Aceder ao NexusOps

1. Abre o **browser** (Chrome, Edge, Firefox)
2. Na barra de endereço escreve:
   ```
   http://localhost:3030
   ```
3. Prime Enter
4. Vai aparecer o ecrã de login — usa:
   - **Email:** `ana@empresa.pt`
   - **Password:** `nexus2026`

🎉 **Está a funcionar!**

---

## Comandos do dia-a-dia

Estes comandos correm na janela preta (Command Prompt), sempre dentro da pasta `nexusops`.

### Como SAIR / PARAR
```
docker compose down
```

### Como VOLTAR a ABRIR
```
docker compose up -d
```
(sem o `--build` desta vez — é mais rápido)

### Como ATUALIZAR para nova versão
```
git pull
docker compose build app
docker compose up -d
```

### Ver mensagens da aplicação (debug)
```
docker logs nexusops_app
```

---

## ⚠️ Problemas comuns

### "docker: command not found"
O Docker Desktop não está a correr.
**Solução:** Procura o ícone da baleia 🐳 na barra de tarefas e arranca-o. Aguarda ficar verde.

### "port 3030 is already allocated"
Outra coisa está a usar a porta 3030.
**Solução:** Edita `docker-compose.yml` com o Bloco de Notas e muda `"3030:3000"` para `"4040:3000"`. Depois usa `http://localhost:4040`.

### Página em branco / erro no browser
A BD ainda não acabou de iniciar.
**Solução:** Aguarda mais 30 segundos e refresca (F5). Se persistir, na janela preta escreve:
```
docker logs nexusops_app
```
e copia o erro para análise.

### "Cannot connect to the Docker daemon"
O Docker Desktop foi fechado.
**Solução:** Abre o Docker Desktop e aguarda que o ícone 🐳 fique verde.

---

## Contas pré-criadas

Password para todas: **`nexus2026`**

| Email | Perfil |
|---|---|
| ana@empresa.pt | Admin (máximas permissões) |
| pedro@empresa.pt | Gestor |
| carlos@empresa.pt | Logística |
| rita@empresa.pt | Logística |

⚠️ **IMPORTANTE em produção:** altera estas passwords no primeiro acesso, no dashboard de Configuração.
