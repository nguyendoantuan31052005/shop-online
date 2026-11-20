# GHN shipping integration

Production status (12/11/2026): GHN credentials are valid, automatic shipment creation is enabled, and the webhook signing secret is stored in Secrets Manager. New eligible COD checkouts are submitted to GHN. To receive live status changes, finish registering the webhook URL and secret in the GHN merchant portal as described below.

The shop can also submit new or confirmed orders to GHN from the admin order list. If automatic creation fails, the customer order is preserved and the admin can retry after fixing the order details.

Required secret JSON keys:

- `GHN_TOKEN`, `GHN_SHOP_ID`: credentials from GHN.
- `GHN_AUTO_CREATE_ORDERS`: set to the JSON string `"true"` to submit new COD orders automatically after checkout.
- `GHN_WEBHOOK_SECRET`: random secret with at least 32 characters. This enables GHN status updates on the site; it is not required just to create shipments.
- `GHN_FROM_NAME`, `GHN_FROM_PHONE`, `GHN_FROM_ADDRESS`, `GHN_FROM_PROVINCE`, `GHN_FROM_WARD`: optional sender overrides. If omitted, GHN uses the pickup profile registered for `GHN_SHOP_ID`. `GHN_FROM_DISTRICT` is optional.
- Product weight and dimensions are resolved per order line from the product's packaging fields in the admin catalog. If those are blank, the app estimates each item's package from its name and category, then totals the order. Review estimates in the admin order card; enter all four measured values on a product for more accurate GHN fees. GHN accepts dimensions up to 200 cm each.
- `GHN_WEBHOOK_SECRET`: random secret with at least 32 characters. This enables GHN status updates on the site; it is not required just to create shipments.
- `GHN_BASE_URL`: optional; defaults to `https://online-gateway.ghn.vn`. For GHN staging use `https://dev-online-gateway.ghn.vn`.
- `GHN_REQUIRED_NOTE`: optional; one of `KHONGCHOXEMHANG`, `CHOXEMHANGKHONGTHU`, or `CHOTHUHANG`.

The checkout needs the recipient's province, ward, and street address to submit an order to GHN. Existing orders and legacy addresses remain available; orders without structured address fields can still use manually entered shipment details. For heavy shipments (20 kg or more), the app sends per-product measurements required by GHN's heavy-goods service.

Configure a GHN order-status webhook in the GHN merchant portal to send `POST` requests to:

`https://dd7z91m61r0gy.cloudfront.net/api/webhooks/ghn`

Set the custom webhook header `X-GHN-Webhook-Token` to the value of `GHN_WEBHOOK_SECRET` in the existing AWS Secrets Manager secret `shop-online/prod/runtime-4d34774f23`. Do not paste the token into chat or commit it. The app deduplicates repeated events and maps pickup/in-transit/delivered statuses to the shop's order status. It does not automatically cancel orders based on failed-delivery events.

Do not paste GHN credentials into chat or commit them to the repository. Update the existing secret in AWS Secrets Manager, then deploy with `scripts/deploy-aws.ps1`; the deploy script passes these optional secret values only to the runtime container.
