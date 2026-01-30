# ADR 001: Processo de Entrada de Mercadorias via Web e Sincronização com Oracle

## 1. Contexto
O processo atual de registro de entrada de mercadorias é ineficiente e propenso a erros. Existe a necessidade de modernizar e automatizar este processo utilizando uma interface web amigável, com os dados coletados sendo persistidos e atualizados em um banco de dados Oracle existente na empresa.

## 2. Problema
Como projetar e implementar um fluxo seguro, escalável e robusto para a entrada de mercadorias através de um website, garantindo que os dados sejam validados e atualizados de forma consistente e confiável no banco de dados Oracle legado, minimizando interrupções e garantindo a integridade dos dados?

## 3. Decisão
Será implementada uma arquitetura que consiste em uma aplicação web (frontend) para a interface do usuário e uma camada de API RESTful (backend) para o processamento e persistência dos dados. A API será responsável por:
- Receber e validar as requisições de entrada de mercadorias do frontend.
- Implementar regras de negócio e validações adicionais.
- Interagir com o banco de dados Oracle utilizando uma camada de persistência (ex: ORM ou JDBC direto) para inserção/atualização dos dados.

A comunicação entre o frontend e o backend será via HTTP/HTTPS, utilizando JSON para a troca de dados. O backend será desenvolvido com foco em performance e resiliência.

## 4. Status
Proposto

## 5. Consequências
### Positivas
- **Eficiência Operacional:** Otimização e agilidade no processo de entrada de mercadorias, reduzindo o tempo e o esforço manual.
- **Redução de Erros:** Validações em tempo real no frontend e backend minimizam erros de digitação e inconsistências de dados.
- **Acessibilidade:** A interface web permite acesso de diferentes locais e dispositivos, facilitando a operação.
- **Rastreabilidade:** Facilita a auditoria e a rastreabilidade das entradas de mercadorias.
- **Reuso:** A camada de API pode ser reutilizada por outras aplicações futuras.

### Negativas
- **Complexidade Inicial:** Maior esforço de desenvolvimento e configuração inicial devido à arquitetura distribuída (frontend + backend).
- **Dependência Oracle:** A performance e a disponibilidade da solução estarão intrinsecamente ligadas à performance e disponibilidade do banco de dados Oracle.
- **Segurança:** Requer atenção dedicada à segurança da aplicação web e da API (autenticação, autorização, proteção contra ataques comuns).

### Neutras
- Necessidade de equipe com experiência em desenvolvimento web (frontend e backend) e integração com bancos de dados Oracle.

## 6. Alternativas Consideradas
### a) Processamento em Lote (Batch Processing)
- **Rationale:** Descartado por não atender ao requisito de agilidade e atualização em tempo real ou quase real via site. Não ofereceria a experiência de usuário desejada para a entrada interativa de mercadorias.

### b) Aplicação Cliente/Servidor Direta (sem API)
- **Rationale:** Descartado por questões de segurança (expor diretamente o banco de dados ou lógica de negócio ao cliente), manutenção, escalabilidade e dificuldade de acesso remoto via navegador. Não se alinha com as práticas modernas de desenvolvimento web.

## 7. Rationale da Escolha
A abordagem com aplicação web e API RESTful oferece o melhor equilíbrio entre agilidade de desenvolvimento, segurança, escalabilidade, experiência do usuário e integração eficaz com o sistema Oracle existente. Ela permite validações robustas em múltiplas camadas, desacopla o frontend do backend, e estabelece uma base para futuras expansões e integrações.