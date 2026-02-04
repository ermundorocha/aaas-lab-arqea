# Detalhes dos Componentes-Chave do AaaS (MVP)

## 1. Serviço de Geração de Blueprint
*   **Propósito**: Responsável por renderizar templates e gerar artefatos arquiteturais (Markdown, JSON, etc.) com base nos parâmetros fornecidos.
*   **Tecnologia**: Pode ser implementado com um motor de templates (ex: Jinja2 para Python, Handlebars para Node.js) ou uma biblioteca de processamento de texto.
*   **Entrada**: `templateId`, `parameters` (JSON).
*   **Saída**: Conteúdo do artefato (string).
*   **Integrações**: Banco de Dados (para buscar templates), Serviço de Gerenciamento de Artefatos (para armazenar o conteúdo gerado).

## 2. Serviço de Gerenciamento de Artefatos
*   **Propósito**: Gerenciar o ciclo de vida dos artefatos (criação, leitura, atualização, exclusão) e seus metadados.
*   **Tecnologia**: Microserviço RESTful.
*   **Armazenamento**: Utiliza um banco de dados relacional (ex: PostgreSQL) para metadados e um armazenamento de objetos (ex: S3 compatível) para o conteúdo binário/texto dos artefatos.
*   **Entradas**: Requisições CRUD para artefatos.
*   **Saídas**: Metadados do artefato, URLs de download.

## 3. Serviço de Gerenciamento de Templates
*   **Propósito**: Gerenciar os templates disponíveis para geração de artefatos. Permite listar, visualizar e, futuramente, criar/atualizar templates.
*   **Tecnologia**: Microserviço RESTful.
*   **Armazenamento**: Banco de dados relacional para metadados de templates e, opcionalmente, armazenamento de objetos para o conteúdo dos templates.
*   **Entradas**: Requisições de listagem e recuperação de templates.
*   **Saídas**: Lista e detalhes de templates.

## 4. Serviço de Autenticação e Autorização (IAM)
*   **Propósito**: Gerenciar usuários, roles e permissões. Validar tokens de autenticação para todas as requisições.
*   **Tecnologia**: Pode ser um serviço existente (ex: Okta, Auth0) ou um serviço básico de JWT customizado para o MVP.
*   **Integrações**: API Gateway (para validação inicial), outros serviços core (para autorização granular).

## 5. API Gateway
*   **Propósito**: Atuar como um proxy reverso e orquestrador de requisições, fornecendo uma fachada unificada para o AaaS.
*   **Funções**: Autenticação, limitação de taxa, roteamento inteligente, transformação de requisições/respostas, logging.
*   **Tecnologia**: Nginx/Kong para auto-hospedagem ou soluções de nuvem (AWS API Gateway, Azure API Management, Google Cloud Endpoints).