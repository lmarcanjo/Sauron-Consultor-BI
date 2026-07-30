# SPRINT 23 — Enterprise Discovery Architecture

## Arquitetura da Camada de Descoberta Corporativa (`EnterpriseDiscoveryEngine`)

A camada `EnterpriseDiscoveryEngine` é responsável por inferir e mapear a **organização de negócios** que existe por trás de dados não estruturados (planilhas ou bancos SQL) sem alterar nem mutar a origem dos dados (READ-ONLY).

### Fluxo de Consumo
```
[Origem Física Read-Only]
       │
       ▼
[ChaosSourceProfile] ──► [SourceDrivenAnalysis] ──► [EnterpriseDiscoveryEngine]
                                                            │
                                                            ▼
                                                     [EnterpriseModel]
                                                     • Áreas Mapeadas
                                                     • Processos Operacionais
                                                     • Entidades Corporativas
                                                     • Relacionamentos
                                                     • Lacunas de Informação
                                                     • Narrativa Rastreável
```
