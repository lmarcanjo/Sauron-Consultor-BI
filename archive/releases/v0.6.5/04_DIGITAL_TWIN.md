# Release v0.6.5 — Digital Twin of the Enterprise

## 1. Overview
The Digital Twin represents the physical, organizational, and operational structure of the client group as a digital state model. 

This model allows Sauron OS to map where data is coming from (stores, CNPJs, brands), who is responsible for each node, and which departments map to specific cost centers.

## 2. Structural Schema
The Digital Twin coordinates:
- **Business Group**: Parent node (e.g. "Grupo Topázio S/A").
- **Company**: Legal entities under the group (e.g. "Topázio Veículos Ltda").
- **Brands**: Distribution brand banners (e.g. "Nissan", "Fiat").
- **Stores**: Retail points with physical locations (e.g. "Loja Nissan Feira"), active headcount trackers, and managers.
- **Departments**: Internal divisions (e.g. "Vendas Novos", "Oficina e Peças") mapped directly to operational cost centers.

## 3. Real-time Synchronization
Changes made in store structures or team headcounts automatically dispatch `DIGITAL_TWIN_UPDATED` events to the platform's immutable audit log, securing a traceable record of structural changes.
