# Global Search Engine Architecture

Sauron's Search Engine indexes records across separate business files, planning matrices, and council decisions.

## Search Providers
Providers register standard indexing behaviors:
```typescript
interface SearchProvider {
  name: string;
  search(query: string): SearchResultItem[];
}
```

The system includes prebuilt default providers for:
1. **Cases Provider**: Clients, subsidiary companies, and CNPJ tracking.
2. **Action Plans Provider**: Plan details, priority, and assigned consultants.
3. **Presentations Provider**: Slide decks, meeting minutes, and financial reports.
