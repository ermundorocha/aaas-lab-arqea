# 3. Segurança por Design

## 3.1 Introdução
Este blueprint descreve as diretrizes e componentes de segurança que serão implementados na plataforma AaaS, seguindo o princípio de Security by Design. A segurança será uma preocupação transversal em todas as camadas da arquitetura.

## 3.2 Áreas de Foco em Segurança
*   **Identidade e Acesso (IAM)**: Utilização de provedor de identidade centralizado (IdP) para autenticação. Controle de acesso baseado em roles (RBAC) e atributos (ABAC) para autorização.
*   **Proteção de Dados**: Criptografia de dados em trânsito (TLS) e em repouso (discos, bancos de dados). Gerenciamento seguro de segredos (secrets management).
*   **Segurança de Aplicações**: Validação de entrada, prevenção contra ataques comuns (OWASP Top 10), segurança de APIs (conforme blueprint 02).
*   **Segurança de Infraestrutura**: Configuração segura de recursos de nuvem, segmentação de rede, uso de contêineres seguros e imagens base confiáveis.
*   **Monitoramento e Auditoria**: Coleta e análise de logs de segurança, detecção de anomalias, trilhas de auditoria para todas as ações relevantes.
*   **Resposta a Incidentes**: Plano de resposta a incidentes de segurança para mitigar e resolver vulnerabilidades e ataques.

## 3.3 Ferramentas e Práticas
*   **Secret Management**: HashiCorp Vault ou KMS do provedor de nuvem.
*   **WAF/CDN**: Proteção contra ataques web e DDoS.
*   **SAST/DAST**: Análise de segurança estática e dinâmica de código.
*   **Varredura de Imagens de Contêiner**: Ferramentas para identificar vulnerabilidades em imagens Docker.
*   **Princípio do Menor Privilégio**: Aplicado a usuários, serviços e recursos.