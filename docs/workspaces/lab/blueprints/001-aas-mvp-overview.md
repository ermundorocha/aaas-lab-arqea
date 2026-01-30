# Blueprint AaaS MVP: Visão Geral

## 1. Introdução
Este blueprint apresenta a visão geral para o Mínimo Produto Viável (MVP) da plataforma Architecture as a Service (AaaS). O objetivo é prover uma infraestrutura que permita a gestão, validação e consumo de artefatos arquiteturais de forma programática.

## 2. Escopo do MVP
O MVP da AaaS focará nos seguintes pilares:
- **Gestão de Artefatos**: Armazenamento, recuperação e versionamento de diferentes tipos de artefatos (e.g., ADRs, Blueprints, Diagramas). Suporte para diversos `contentType` (Markdown, JSON, XML).
- **Validação de Schema**: Aplicação de schemas (e.g., JSON Schema) para garantir a conformidade e integridade dos artefatos submetidos.
- **API RESTful**: Uma interface programática padronizada para interagir com os serviços de gestão e validação de artefatos.
- **Autenticação e Autorização Básicas**: Mecanismos iniciais para proteger o acesso aos recursos e garantir que apenas usuários autorizados possam realizar operações.

## 3. Componentes Principais (MVP)
### 3.1. Serviço de Artefatos (Artifact Service)
- **Responsabilidades**: CRUD (Create, Read, Update, Delete) de artefatos arquiteturais.
- **Armazenamento**: Gerenciamento de metadados dos artefatos em um banco de dados relacional (e.g., PostgreSQL) e armazenamento do conteúdo do artefato em um armazenamento de objetos (e.g., compatível com S3) para escalabilidade e baixo custo.
- **Versionamento**: Suporte básico para o versionamento de artefatos.

### 3.2. Serviço de Schema (Schema Service)
- **Responsabilidades**: Gerenciamento e armazenamento de schemas (e.g., JSON Schema, YAML Schema) utilizados para validar artefatos.
- **Validação**: Oferece um endpoint para validar artefatos contra schemas registrados, retornando resultados de conformidade.

### 3.3. Gateway API (API Gateway)
- **Responsabilidades**: Ponto de entrada unificado para todos os serviços da AaaS.
- **Funcionalidades**: Gerenciamento de autenticação (e.g., JWT), autorização, roteamento de requisições para os serviços apropriados e rate limiting para proteção contra abusos.

## 4. Tecnologia Sugerida (Exemplos para MVP)
- **Linguagem Backend**: Go ou Python (para microsserviços leves e alta performance).
- **Banco de Dados (Metadados)**: PostgreSQL (para robustez e integridade transacional).
- **Armazenamento de Objetos (Conteúdo)**: MinIO ou compatível com S3 (para escalabilidade e durabilidade).
- **Containerização**: Docker (para empacotamento e isolamento dos serviços).
- **Orquestração**: Docker Compose (para implantações simples do MVP) com plano de evolução para Kubernetes em fases futuras.
- **Cloud Provider**: Agnostic, priorizando serviços gerenciados para reduzir a sobrecarga operacional.

## 5. Próximos Passos
- Detalhamento dos contratos de API para cada serviço.
- Definição do modelo de dados detalhado para Artefatos e Schemas.
- Realização de uma Prova de Conceito (PoC) para os serviços principais e fluxo de validação.
- Planejamento da estratégia de segurança e observabilidade para o MVP.