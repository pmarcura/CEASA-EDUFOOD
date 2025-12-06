# 🍎 EduFood Family – CEASA-EDUFOOD

Sistema experimental de apoio à **nutrição familiar** pensado para pais e mães de crianças em idade escolar.  
O EduFood Family combina **Design da Informação**, **IA (no futuro)** e uma interface amigável para ajudar famílias a:

- Entender melhor o que estão comprando e oferecendo às crianças;
- Organizar despensa e planejamento de refeições;
- Reduzir ultraprocessados de forma prática, sem culpa e sem sermão.

Este repositório faz parte do projeto desenvolvido na disciplina de **Metodologia de Pesquisa em Design**, em parceria com a **CEASA / Programa de Alimentação Escolar**.

---

## 📌 Sumário

- [Contexto e Objetivo](#-contexto-e-objetivo)
- [Principais Funcionalidades do MVP](#-principais-funcionalidades-do-mvp)
- [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
- [Como Rodar o Projeto Localmente](#-como-rodar-o-projeto-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Estrutura de Pastas (sugerida)](#-estrutura-de-pastas-sugerida)
- [Fluxos Principais do App](#-fluxos-principais-do-app)
- [Roadmap](#-roadmap)
- [Como Contribuir](#-como-contribuir)
- [Licença](#-licença)

---

## 🎯 Contexto e Objetivo

O **EduFood Family** nasce como um experimento de Design da Informação aplicado à **educação alimentar de pais de crianças do 1º ciclo do Ensino Fundamental**, considerando:

- Falta de tempo para cozinhar;
- Dificuldade em planejar e aproveitar o que já existe em casa;
- Desconhecimento prático sobre **in natura x processado x ultraprocessado**;
- Dificuldade em engajar crianças em hábitos mais saudáveis.

O app busca funcionar como um **“sistema operacional para pais” focado em alimentação**, começando por um **MVP funcional** que permite:

- Criar conta e fazer login;
- Cadastrar família e filhos;
- Registrar itens de despensa;
- Criar receitas manualmente;
- Planejar a semana;
- Visualizar, de forma simples, o quanto a alimentação está mais “verde” (in natura) ou “vermelha” (ultraprocessados).

---

## ✨ Principais Funcionalidades do MVP

### 1. Autenticação e Perfil Familiar

- Login e cadastro com **e-mail e senha** (Firebase Auth).
- Login com **Google** (Sign in with Google).
- Cadastro de:
  - Nome da família;
  - Dados básicos das crianças (idade, nome, preferências rápidas).

---

### 2. Despensa Inteligente (versão MVP)

- Cadastro manual de itens com:
  - Nome do produto;
  - Categoria (frutas, laticínios, snacks, etc.);
  - Tipo de unidade (unidade, kg, g, pacote, litro);
  - Quantidade.
- Tags nutricionais básicas:
  - In natura / processado / ultraprocessado (selecionado pelo usuário por enquanto).
- Edição rápida de:
  - Quantidade;
  - Unidade;
  - Remoção do item.

*(Futuras versões: leitura de nota fiscal, OCR, classificação automática por IA etc.)*

---

### 3. Receitas

- Criação manual de receitas pela família:
  - Nome da receita;
  - Lista de ingredientes (com quantidade e unidade);
  - Passo a passo textualmente organizado;
  - Campo opcional de dicas para crianças (ex.: “Deixe seu filho misturar o molho”).
- Ligação com a despensa:
  - Selecionar ingredientes a partir dos itens já cadastrados (quando possível);
  - Possibilidade de marcar que uma receita “usa o que já tem em casa”.

*(Futuras versões: geração de receita com IA com base na despensa e perfil da criança.)*

---

### 4. Planejamento Semanal

- Planejamento de refeições por **dias da semana** (ex.: Segunda a Domingo).
- Marcação de:
  - Jantar (prioritário para o MVP);
  - Outras refeições (campo texto opcional ou estados simples).
- Sugestão de receitas já existentes no app:
  - Seleção rápida de receitas salvas;
  - Indicação visual quando a receita é mais “verde” (mais in natura).

---

### 5. Gamificação (Primeira Camada)

- Conceito de **XP da Família** (progresso baseado em ações saudáveis).
- **Cenouras Douradas** como moeda interna (conceito já definido no produto):
  - Ganhas ao cozinhar receitas saudáveis;
  - Ganhas ao registrar alimentos in natura na despensa.
- Ideia de uso futuro:
  - Troca de Cenouras Douradas por **cupons de parceiros** (mercados, hortifruti, produtos saudáveis).

---

## 🏗 Arquitetura e Tecnologias

> Atenção: Ajuste esta seção conforme o stack que você realmente está usando no repositório.  
> Abaixo está a stack que mais conversa com o que já trabalhamos no código (AuthScreen, Tailwind, Firebase etc.).

**Front-end**

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (dev server e build)
- [Tailwind CSS](https://tailwindcss.com/) (estilização)
- [Lucide React](https://lucide.dev/) (ícones)

**Back-end / BaaS**

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)

**Outros**

- ESLint + Prettier (boa prática de código – opcional, mas recomendado)
- Deploy: Vercel / Firebase Hosting / outro (preencher de acordo com o projeto real)

---

## ⚙️ Como Rodar o Projeto Localmente

### 1. Pré-requisitos

- **Node.js** (versão recomendada: >= 18)
- **npm** ou **yarn** ou **pnpm**
- Uma conta no **Firebase** com um projeto criado (para Auth + Firestore)

### 2. Clonar o repositório

```bash
git clone https://github.com/pmarcura/CEASA-EDUFOOD.git
cd CEASA-EDUFOOD
