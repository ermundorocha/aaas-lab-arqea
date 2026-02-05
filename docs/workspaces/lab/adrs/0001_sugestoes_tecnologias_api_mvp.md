# ADR 0001: Sugestões de Tecnologias para Desenvolvimento de API (MVP)

## Status
Proposto

## Contexto
O objetivo é desenvolver uma API para um Produto Mínimo Viável (MVP), priorizando rapidez no desenvolvimento, potencial de escalabilidade futura e otimização de custos iniciais. As tecnologias escolhidas devem facilitar a entrega rápida e serem robustas o suficiente para uma possível evolução.

## Decisão
Com base nos requisitos de um MVP, propomos as seguintes tecnologias:

### Linguagem de Programação e Framework
**Python com FastAPI**
*   **Justificativa:** Python é amplamente conhecido por sua produtividade e vasta biblioteca. FastAPI se destaca pela performance (comparável a Node.js e Go em muitos cenários), suporte assíncrono nativo, tipagem robusta via Pydantic e geração automática de documentação OpenAPI (Swagger UI/ReDoc), o que acelera significativamente o desenvolvimento e a colaboração.

### Banco de Dados
**PostgreSQL**
*   **Justificativa:** Um sistema de gerenciamento de banco de dados relacional (SGBDR) robusto e confiável, que oferece excelente performance, integridade de dados e flexibilidade (suporta dados JSONB, tornando-o útil para cenários NoSQL). Sua licença open-source e ampla comunidade garantem suporte e custos controlados.

### Autenticação e Autorização
**JSON Web Tokens (JWT) com OAuth 2.0 (opcionalmente)**
*   **Justificativa:** JWTs são um padrão da indústria para autenticação stateless, o que facilita a escalabilidade da API. Para um MVP, pode-se implementar um fluxo simples de emissão e validação de JWTs. Se houver necessidade de integração com terceiros ou fluxos de autorização mais complexos, o OAuth 2.0 pode ser incorporado, sendo compatível com JWTs como tokens de acesso.

### Infraestrutura e Deployment
**Docker com Serverless (ex: AWS Lambda, Google Cloud Functions)**
*   **Justificativa (Docker):** Para empacotar a aplicação e suas dependências de forma consistente, garantindo que o ambiente de desenvolvimento seja idêntico ao de produção, eliminando problemas de 'funciona na minha máquina'.
*   **Justificativa (Serverless):** Para um MVP, a arquitetura serverless pode reduzir drasticamente a complexidade operacional e os custos iniciais, pagando apenas pelo uso. Permite focar na lógica de negócios e adiar a preocupação com a gestão de servidores, facilitando a escalabilidade automática para picos de demanda. Alternativamente, uma VM simples com Docker pode ser uma opção de baixo custo para iniciar.

### Documentação da API
**OpenAPI Specification (Swagger UI/ReDoc)**
*   **Justificativa:** Como o FastAPI já integra nativamente a geração de documentação OpenAPI, esta será a ferramenta padrão. Ela oferece uma interface interativa para explorar e testar os endpoints da API, o que é crucial para a integração de clientes e para a manutenção futura.

## Consequências

### Positivas
*   **Agilidade:** Rápida prototipagem e desenvolvimento devido à produtividade de Python/FastAPI e recursos de documentação automática.
*   **Custo-benefício:** Tecnologias open-source (Python, FastAPI, PostgreSQL, Docker) e modelo de pagamento por uso (Serverless) mantêm os custos iniciais baixos.
*   **Escalabilidade:** A combinação de FastAPI, PostgreSQL e Serverless/Docker oferece um caminho claro para escalar a aplicação conforme a demanda cresce.
*   **Manutenibilidade:** Código limpo e documentação gerada automaticamente contribuem para a facilidade de manutenção.

### Negativas
*   **Curva de Aprendizado:** Desenvolvedores sem experiência em Python, FastAPI ou arquitetura serverless podem enfrentar uma curva de aprendizado inicial.
*   **Vendor Lock-in (Serverless):** O uso de soluções serverless pode introduzir algum nível de dependência do provedor de nuvem (AWS, GCP).