# Design da API Core do AaaS (MVP)

## 1. Visão Geral
Este blueprint detalha o design da API RESTful para os serviços core do AaaS, com foco na simplicidade e usabilidade para o MVP.

## 2. Recursos e Endpoints
### 2.1 Artefatos
*   **Descrição**: Representa um artefato arquitetural gerado ou gerenciado pelo AaaS.
*   **URI Base**: `/api/v1/artifacts`
*   **Métodos**: 
    *   `POST /api/v1/artifacts`: Cria um novo artefato baseado em um template ou especificação.
        *   **Corpo da Requisição**: `{ "templateId": "string", "parameters": { "key": "value" } }`
        *   **Corpo da Resposta**: `{ "artifactId": "string", "status": "string", "downloadUrl": "string" }`
    *   `GET /api/v1/artifacts/{artifactId}`: Recupera os metadados de um artefato específico.
        *   **Corpo da Resposta**: `{ "artifactId": "string", "status": "string", "createdAt": "datetime", "metadata": {}, "downloadUrl": "string" }`
    *   `GET /api/v1/artifacts/{artifactId}/content`: Baixa o conteúdo do artefato.
        *   **Corpo da Resposta**: Conteúdo bruto do artefato (ex: markdown, JSON, XML).

### 2.2 Templates
*   **Descrição**: Representa um template de artefato disponível para criação.
*   **URI Base**: `/api/v1/templates`
*   **Métodos**: 
    *   `GET /api/v1/templates`: Lista todos os templates disponíveis.
        *   **Corpo da Resposta**: `[ { "templateId": "string", "name": "string", "description": "string", "parametersSchema": {} } ]`
    *   `GET /api/v1/templates/{templateId}`: Recupera os detalhes de um template específico.
        *   **Corpo da Resposta**: `{ "templateId": "string", "name": "string", "description": "string", "parametersSchema": {} }`

## 3. Autenticação e Autorização
*   **Autenticação**: Baseada em tokens JWT (Bearer Token) emitidos após login ou via chaves de API.
*   **Autorização**: RBAC (Role-Based Access Control) básico. Roles como `architect`, `developer`, `viewer` com permissões distintas.

## 4. Versionamento
*   Uso de versionamento na URI (`/api/v1/`).

## 5. Tratamento de Erros
*   Utilização de códigos de status HTTP padrão (4xx para erros do cliente, 5xx para erros do servidor).
*   Corpo da resposta de erro padronizado: `{ "errorCode": "string", "message": "string", "details": "string" }`.