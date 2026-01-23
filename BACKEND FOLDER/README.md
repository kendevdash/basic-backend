## Authentication Flow
- JWT access tokens (15 min)
- Refresh tokens (7 days, stored in DB)
- Role-based access (Admin, Teacher, Student)

## Payment Flow
- Payment intent creation
- Webhook verification
- Enrollment unlock after payment

## Course Access Control
- Enrollment-based access
- Admin/Teacher override


## Payments & Course Access

The platform supports multiple payment methods designed for real-world usage,
including manual and semi-manual verification flows.

### Supported Payment Methods
- MTN MoMo
- Bank Transfer
- Bitcoin
- USDT

### Payment Flow Overview

1. **Student initiates payment**
   - Student selects a course and payment method.
   - A payment record is created with status `PENDING` or `UNDER_REVIEW`.
   - No course access is granted at this stage.

2. **Payment verification**
   - For manual payments (Bank Transfer, Crypto), students provide proof
     such as a receipt or transaction hash.
   - Payments remain in `PENDING` or `UNDER_REVIEW` status until reviewed.

3. **Admin approval**
   - Admin reviews payment details and proof.
   - Admin can either approve or reject the payment.
   - On approval:
     - Payment status is set to `COMPLETED`
     - Student enrollment is created or updated
     - Course access is granted
   - On rejection:
     - Payment status is set to `FAILED`

4. **Course access control**
   - Only students with a completed payment and active enrollment
     can access course content.
   - Admins and teachers have unrestricted access.

### Refunds
- Refunds can only be processed for completed payments.
- When a refund is issued:
  - Payment status is set to `REFUNDED`
  - Course access is revoked automatically.

### Security Notes
- Payment approval is restricted to admin users only.
- Course access is protected by enrollment-based middleware.
- The payment system is designed to support future automated gateway
  integrations via webhooks.
