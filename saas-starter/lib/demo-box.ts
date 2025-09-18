export const demoBoxDraft = {
  name: 'Demo Checkout Box',
  description: 'Pre-seeded box for Budibase designer demos and smoke tests.',
  tags: ['demo', 'budibase'],
  schema: {
    schema: {
      title: 'Demo Cart Mandate',
      type: 'object',
      properties: {
        cartId: {
          title: 'Cart ID',
          type: 'string',
          description: "Reference identifier for the shopper's cart",
        },
        currency: {
          title: 'Currency',
          type: 'string',
          enum: ['USD', 'EUR', 'GBP'],
          default: 'USD',
        },
        total: {
          title: 'Order Total',
          type: 'number',
          minimum: 0,
        },
        lineItems: {
          title: 'Line Items',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string', title: 'SKU' },
              name: { type: 'string', title: 'Name' },
              quantity: { type: 'integer', title: 'Qty', minimum: 1 },
              unitPrice: { type: 'number', title: 'Unit Price', minimum: 0 },
            },
            required: ['sku', 'quantity', 'unitPrice'],
          },
        },
        policies: {
          title: 'Policy Flags',
          type: 'object',
          properties: {
            fraudCheck: { type: 'boolean', title: 'Fraud Check' },
            manualReview: { type: 'boolean', title: 'Manual Review' },
            allowBackorder: { type: 'boolean', title: 'Allow Backorder' },
          },
        },
      },
      required: ['cartId', 'currency', 'lineItems'],
    },
    ui: {
      layout: [
        { type: 'row', fields: ['cartId', 'currency', 'total'] },
        { type: 'section', title: 'Line Items', fields: ['lineItems'] },
        { type: 'section', title: 'Policies', fields: ['policies'] },
      ],
    },
    version: 'v0',
  },
} as const;
