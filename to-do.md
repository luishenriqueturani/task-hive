
# Tasks

## Por fazer
- Módulo de Projetos
  - CRUD de projetos
  - CRUD de tarefas
  - CRUD de membros
    - Sistema de amizades
  - CRUD de subtarefas
  - Sistema de timetrak
    - websocket para as atualizações do timetrack
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

## Locais com disparo de notificações e envio de emails
- to-do.service/create
- to-do.service/endTask
- auth.service/forgetPassword
- auth.service/resetPassword


## Feito

- Base do banco de dados
- Módulo de CRUD de usuários
- Módulo de autenticação
- Controle de sessão
- CRUD Módulo de tarefas avulsas