# 💸 EASYTIP

## 🧩 Problema Central  
Criadores de conteúdo em plataformas como o YouTube enfrentam dificuldades para receber gorjetas de forma direta, automática e transparente.  
As opções atuais (como “Super Chat”) cobram taxas elevadas e limitam a liberdade de pagamento, além de dificultar a integração com sistemas externos.  

O **EASYTIP** resolve esse problema automatizando o envio de gorjetas para criadores de conteúdo a partir de dados coletados diretamente do YouTube — tudo integrado a uma carteira blockchain **Base** e a um **Mini App**.  
O **EASYTIP** permite o envio rápido e seguro de gorjetas digitais, sem intermediários e com total rastreabilidade.

---

## 🌐 Visão Geral  
O **EASYTIP** é uma solução descentralizada que conecta **criadores de conteúdo** e **fãs** através de um ecossistema simples e transparente.  
O sistema combina uma **extensão do YouTube** que coleta dados sobre vídeos e canais com um **Mini App**, onde o usuário pode configurar e enviar gorjetas automáticas para seus criadores favoritos.

### ⚙️ Como funciona:
1. 🧩 **Extensão do YouTube** coleta informações como nome do canal, tempo de visualização e status de inscrição, com autenticação via JWT.  
2. 📤 Esses dados são enviados ao **Mini App EASYTIP**.  
3. 💰 O Mini App permite configurar gorjetas automáticas via blockchain e gerencia um sistema de autenticação de canais e endereços de carteiras tanto de usuários quanto de criadores de conteúdo.  
4. 🔗 As transações são registradas em um **smart contract**, garantindo transparência, rastreabilidade e possibilidade de lucro através de pequenas taxas configuráveis.  

### 🔧 Principais Funcionalidades:
- 🔗 Envio de gorjetas em criptomoeda  
- 💳 Integração com carteira digital da Base  
- 👤 Perfil de usuários e histórico de transações  
- 🧾 Transparência total das gorjetas recebidas  
- ⚙️ Automatização de gorjetas com parâmetros configuráveis  

---

## 💻 Tecnologias Usadas  

| Categoria | Tecnologias |
|------------|--------------|
| **Linguagem Principal** | TypeScript |
| **Frontend** | React |
| **Framework** | Scaffold-ETH |
| **Smart Contracts** | Solidity, Hardhat |
| **Blockchain** | Base Network |
| **Banco de Dados** | Prisma |
| **Extensão / Integração** | Chrome Extension (YouTube API + Messaging) |

---

## 🧩 Passo a Passo de Inicialização  

Siga as instruções abaixo para configurar o projeto **EASYTIP** em sua máquina local.

```bash
# Clone o repositório
git clone https://github.com/Warphn/ETH-Latam---Polichain

# Acesse a pasta do frontend
cd packages/nextjs

# Instale as dependências
yarn install

# Rode a aplicação localmente
yarn run dev
