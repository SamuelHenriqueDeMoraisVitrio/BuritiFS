#!/usr/bin/env bash
set -e

# ── Dependência ────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  echo "Erro: 'claude' não encontrado no PATH." >&2
  exit 1
fi

# ── Sem mudanças ───────────────────────────────────────────────
if git diff --quiet && git diff --cached --quiet; then
  echo "Nada para commitar."
  exit 0
fi

echo "⚠  'git add .' será executado — certifique-se de que seu .gitignore está correto."

# ── Coleta contexto ────────────────────────────────────────────
STATUS=$(git status --short)
DIFF=$(git diff HEAD 2>/dev/null || git diff --cached)

# Trunca diffs muito grandes para não degradar a resposta da IA
MAX_DIFF_CHARS=12000
if [ ${#DIFF} -gt $MAX_DIFF_CHARS ]; then
  DIFF="${DIFF:0:$MAX_DIFF_CHARS}"$'\n''... [diff truncado]'
fi

# ── Gera mensagem via Claude CLI ───────────────────────────────
echo "Gerando mensagem de commit com IA..."

COMMIT_MSG=$(claude -p "Você é um gerador de conventional commits. Analise as mudanças abaixo e gere UMA mensagem de commit seguindo o padrão conventional commits (feat, fix, refactor, test, chore, docs, etc).

Regras:
- Formato: tipo(escopo): mensagem curta em inglês
- Escopo é opcional, use apenas se for claro
- Mensagem curta e direta (max 72 chars)
- Se o diff tocar mais de um arquivo ou área, adicione corpo após linha em branco com bullet points explicando o que mudou em cada parte
- Responda APENAS com a mensagem de commit, sem explicações

Status:
$STATUS

Diff:
$DIFF")

# ── Confirmação ────────────────────────────────────────────────
echo ""
echo "--- Commit gerado ---"
echo "$COMMIT_MSG"
echo "---------------------"
read -rp "Confirmar? [S/n/e(ditar)]: " confirm

case "$confirm" in
  [nN]) echo "Abortado."; exit 0 ;;
  [eE])
    if command -v vipe &>/dev/null; then
      COMMIT_MSG=$(echo "$COMMIT_MSG" | vipe)
    else
      echo "Mensagem atual: $COMMIT_MSG"
      read -rp "Nova mensagem: " COMMIT_MSG
    fi
    ;;
esac

# ── Commit ─────────────────────────────────────────────────────
git add .
git commit -m "$COMMIT_MSG"
