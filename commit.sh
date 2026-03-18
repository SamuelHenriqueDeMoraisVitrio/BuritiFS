#!/usr/bin/env bash
set -e

# Verifica se há mudanças
if git diff --quiet && git diff --cached --quiet; then
  echo "Nada para commitar."
  exit 0
fi

# Coleta contexto das mudanças
STATUS=$(git status --short)
DIFF=$(git diff HEAD 2>/dev/null || git diff --cached)

echo "Gerando mensagem de commit com IA..."

# Gera mensagem via Claude CLI
COMMIT_MSG=$(claude -p "Você é um gerador de conventional commits. Analise as mudanças abaixo e gere UMA mensagem de commit seguindo o padrão conventional commits (feat, fix, refactor, test, chore, docs, etc).

Regras:
- Formato: tipo(escopo): mensagem curta em inglês
- Escopo é opcional, use apenas se for claro
- Mensagem curta e direta (max 72 chars)
- Se necessário, adicione corpo explicativo após linha em branco
- Responda APENAS com a mensagem de commit, sem explicações

Status:
$STATUS

Diff:
$DIFF")

echo ""
echo "--- Commit gerado ---"
echo "$COMMIT_MSG"
echo "---------------------"
read -rp "Confirmar? [S/n/e(ditar)]: " confirm

case "$confirm" in
  [nN]) echo "Abortado."; exit 0 ;;
  [eE])
    COMMIT_MSG=$(echo "$COMMIT_MSG" | vipe 2>/dev/null || read -rp "Mensagem: " m && echo "$m")
    ;;
esac

git add .
git commit -m "$COMMIT_MSG"
