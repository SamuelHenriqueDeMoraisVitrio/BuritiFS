# BuritiFS


## À fazer:

### Prioridades:

#### Baixa:
- [x] validatePath deve ter um retorno;
- [x] Precisa checar event.oldVersion;
- [ ] Talvez colocar OPFS de forma sincrona;
- [ ] No write ao modificar o updatedAt se o OPFS falhar ele não volta para o estado anterior;
- [ ] moveNode chama removeNode antes de mover quando force=true;
- [ ] Herança profunda (7 níveis);

#### Media:
- [x] Finalizar o index.db;
- [x] O registry de IDB não previne múltiplas conexões;
- [x] Melhoria de transação do copyNode;
- [x] O ExplorerFile em copy aceita merge, que não faz sentido;
- [x] recoverOrphans pode falhar silenciosamente em browsers sem suporte
- [ ] Finalizar build

#### Alta:
- [x] moveNode de pasta não é atômico;
- [x] Criar o read e write;
- [ ] Criar suporte para react;
- [ ] Documentação;
