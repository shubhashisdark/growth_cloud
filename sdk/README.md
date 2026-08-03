# @growthcloud/sdk

Official JavaScript and TypeScript SDK for **Growth Cloud** marketing automation, lead tracking, and analytics platform.

---

## 📦 Installation

```bash
# npm
npm install @growthcloud/sdk

# yarn
yarn add @growthcloud/sdk

# pnpm
pnpm add @growthcloud/sdk
```

---

## Quickstart Guide

### 1. Initialize the SDK

Obtain your **Public SDK Key** from the Growth Cloud Integrations dashboard (`pk_live_...`).

```typescript
import { init } from '@growthcloud/sdk';

const growthcloud = init({
  publicKey: 'pk_live_abcdef1234567890',
  autoCaptureForms: true, // Automatically captures HTML form submissions
});
```

---

### 2. Identify Leads

Associate web visitor traits with an email address.

```typescript
await growthcloud.identify('sarah@acmecorp.com', {
  firstName: 'Sarah',
  lastName: 'Connor',
  company: 'Acme Corp',
  lifecycleStage: 'mql',
  customFields: {
    planType: 'Enterprise',
  },
});
```

---

### 3. Track Custom Events

Track visitor behavior and custom actions for workflow automation and scoring.

```typescript
await growthcloud.track('demo_requested', {
  category: 'onboarding',
  value: 500,
  pageUrl: window.location.href,
});
```

---

### 4. Lead Synchronization (`leadSync`)

Synchronize full contact lead records directly from server-side Node.js or frontend forms.

```typescript
await growthcloud.leadSync({
  email: 'alex@techfirm.io',
  firstName: 'Alex',
  lastName: 'Rivera',
  company: 'TechFirm',
  source: 'website_calculator',
  status: 'active',
});
```

---

### 5. Form Submissions (`submitForm`)

Manually submit form submissions to trigger workflow automation and lead creation.

```typescript
await growthcloud.submitForm('contact_us_form', {
  email: 'user@domain.com',
  name: 'Taylor Smith',
  message: 'Inquiring about enterprise pricing plans.',
});
```

---

## 🌐 HTML Script Tag Embed

For non-Node projects, embed directly via Script Tag:

```html
<script src="https://cdn.growthcloud.io/v1/sdk.js"></script>
<script>
  window.growthcloud.init({
    publicKey: 'pk_live_abcdef1234567890',
    autoCaptureForms: true
  });

  window.growthcloud.track('page_viewed', { path: window.location.pathname });
</script>
```

---

## Security & Public Key Authentication

The SDK communicates via public API keys (`pk_live_...`). Public keys permit lead identification, event tracking, and form capture while restricting sensitive backend configuration access.
