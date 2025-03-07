
# Tasks

## Por fazer
- Módulo de Projetos
  - Sistema de timetrak
  - CRUD de membros
    - Sistema de amizades
    - websocket para as atualizações do timetrack
  - Lógica para participantes de projetos
- Lógica Módulo de tarefas avulsas
  - implementar os cronjobs
    - o cronjob roda no horário agendado, porém as tarefas executam no kafka 
  - implementar o kafka
    - para o envio de notificações
    - para o envio de emails
    - para executar as lógicas dos cronjobs
- Lógica para Usuário empresa
  - Ter empresa como dona de projeto
  - Empresa poder linkar membros aos projetos
  - Sessão por empresa? (talvez ter um usuário CEO da empresa)
  - Permissionamento nas rotas da empresa, elas estão liberadas

## Locais com disparo de notificações e envio de emails
- to-do.service/create
- to-do.service/endTask
- auth.service/forgetPassword
- auth.service/resetPassword


## Feito
- Módulo de Projetos
  - CRUD de subtarefas
  - CRUD de projetos
  - Colunas de projetos (project stages)
  - CRUD de tarefas
  - Update de tarefas para preenchimento de todos os campos
- CRUD de company
- CRUD Módulo de tarefas avulsas
- Controle de sessão
- Módulo de autenticação
- Módulo de CRUD de usuários
- Base do banco de dados