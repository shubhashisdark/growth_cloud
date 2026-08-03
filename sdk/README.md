# @shubhashis9556/growthcloud-sdk

Official JavaScript and TypeScript SDK for **Growth Cloud** marketing automation, lead tracking, and analytics.

---

## Installation

```bash
npm install @shubhashis9556/growthcloud-sdk
```

Package: [https://www.npmjs.com/package/@shubhashis9556/growthcloud-sdk](https://www.npmjs.com/package/@shubhashis9556/growthcloud-sdk)

---

## Quickstart

Get your **Public SDK Key** from Growth Cloud → Integrations (`gc_pub_...`).

```typescript
import { init } from '@shubhashis9556/growthcloud-sdk';

const growthcloud = init({
  publicKey: 'gc_pub_your_key_here',
  baseUrl: 'https://your-api.example.com', // optional, defaults to http://localhost:4000
  autoCaptureForms: true,
});
```

### Identify leads

```typescript
await growthcloud.identify('sarah@acmecorp.com', {
  firstName: 'Sarah',
  lastName: 'Connor',
  company: 'Acme Corp',
});
```

### Track events

```typescript
await growthcloud.track('added_to_cart', {
  productId: 'sku_123',
  value: 2999,
});
```

### Sync a lead / submit a form

```typescript
await growthcloud.leadSync({
  email: 'alex@techfirm.io',
  firstName: 'Alex',
  lastName: 'Rivera',
  company: 'TechFirm',
  source: 'website',
});

await growthcloud.submitForm('contact_us_form', {
  email: 'user@domain.com',
  name: 'Taylor Smith',
});
```

---

## Security

Use **public** keys (`gc_pub_...`) in browsers. Keep secret keys (`gc_live_...`) on the server only.
