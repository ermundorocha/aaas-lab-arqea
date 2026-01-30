# ADR 001: Migração de Monolito para Microsserviços com Foco em Latência de Rede

## Status
Aceito

## Context
Nosso sistema atual é um monolito robusto que tem servido bem às nossas necessidades por anos. No entanto, enfrentamos desafios crescentes em termos de escalabilidade, velocidade de desenvolvimento, implantação independente de funcionalidades e resiliência. A arquitetura monolítica atual dificulta a alocação de recursos de forma granular e a introdução de novas tecnologias para partes específicas do sistema sem impactar o todo. A principal preocupação em uma transição para microsserviços é o impacto potencial na latência de rede, dado o aumento das chamadas inter-serviços.

## Decisão
Decidimos migrar progressivamente de nosso sistema monolítico para uma arquitetura baseada em microsserviços. A estratégia inicial será a adoção do padrão Strangler Fig, extraindo funcionalidades críticas e de alto tráfego em serviços independentes. Para mitigar o risco de latência de rede, as seguintes abordagens serão priorizadas:
1.  **Comunicação Assíncrona**: Utilização extensiva de filas de mensagens (e.g., Kafka, RabbitMQ) para comunicação entre serviços, desacoplando produtores e consumidores e minimizando chamadas síncronas que dependem diretamente da rede.
2.  **API Gateway Inteligente**: Implementação de um API Gateway para orquestrar chamadas a múltiplos serviços, agregando respostas e reduzindo o número de requisições do cliente para a rede interna. O gateway também pode implementar caching e roteamento eficiente.
3.  **Implantação Co-localizada (quando aplicável)**: Para serviços com alta interdependência e volume de comunicação, buscaremos co-localizá-los na mesma infraestrutura lógica (e.g., mesmo nó Kubernetes, mesma availability zone) para reduzir a latência de rede física.
4.  **Otimização de Protocolos**: Avaliar e, onde apropriado, utilizar protocolos de comunicação eficientes como gRPC para chamadas internas de alta performance, em vez de HTTP/JSON para todos os casos.

## Consequências
### Positivas
*   **Escalabilidade Aprimorada**: Componentes podem ser escalados independentemente com base na demanda.
*   **Resiliência**: Falhas em um serviço terão menor probabilidade de afetar todo o sistema.
*   **Desenvolvimento Ágil**: Equipes podem desenvolver e implantar serviços de forma independente e mais rápida.
*   **Tecnologias Diversificadas**: Flexibilidade para usar a melhor tecnologia para cada serviço.

### Negativas
*   **Complexidade Operacional**: Aumenta a complexidade de implantação, monitoramento e depuração.
*   **Consistência de Dados**: Desafios na manutenção da consistência de dados em um ambiente distribuído.
*   **Aumento Potencial da Latência**: Apesar das estratégias de mitigação, um design inadequado pode levar a um aumento geral da latência devido a múltiplas chamadas de rede. Requer monitoramento contínuo e otimização.
*   **Desenvolvimento Distribuído**: Maior sobrecarga de comunicação entre equipes.

## Alternativas Consideradas
*   **Manter Monolito com Otimizações**: Continuar otimizando o monolito através de profiling e refatoração pontual.
    *   *Prós*: Menor custo inicial, menor risco de introduzir nova complexidade distribuída.
    *   *Contras*: Não resolve problemas fundamentais de escalabilidade, dependência de tecnologia única, gargalos de desenvolvimento persistentes.
*   **Refatoração "Big Bang"**: Reescrita completa do sistema em microsserviços.
    *   *Prós*: Oportunidade de corrigir todos os débitos técnicos de uma vez.
    *   *Contras*: Risco extremamente alto, longo tempo de desenvolvimento, impacto negativo na entrega de valor ao negócio durante a transição.
