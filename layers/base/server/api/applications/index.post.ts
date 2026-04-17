import { and, eq } from 'drizzle-orm'
import { applications, documents, statusHistory, users } from '@tranzito/db'
import { requireRole } from '../../utils/auth'
import { useMailService, renderMailTemplate } from '../../utils/mail'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['broker'])
  const config = useRuntimeConfig()
  const db = useDb()

  // Parse multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({
      statusCode: 400,
      message: 'Invalid form data',
    })
  }

  // Extract fields
  const fields: Record<string, string> = {}
  const files: Array<{ name: string; data: Buffer; type: string }> = []

  for (const part of formData) {
    if (part.filename) {
      files.push({
        name: part.filename,
        data: part.data,
        type: part.type || 'application/octet-stream',
      })
    } else if (part.name) {
      fields[part.name] = part.data.toString()
    }
  }

  // Validate required fields
  const requiredFields = ['borrowerName', 'borrowerPhone', 'propertyAddress', 'marketValue', 'currentDebt', 'bankAName', 'loanTermDays']
  for (const field of requiredFields) {
    if (!fields[field]) {
      throw createError({
        statusCode: 400,
        message: `Missing required field: ${field}`,
      })
    }
  }

  // Create application
  const [application] = await db
    .insert(applications)
    .values({
      brokerId: user.id,
      borrowerName: fields.borrowerName,
      borrowerPhone: fields.borrowerPhone,
      borrowerEmail: fields.borrowerEmail || null,
      propertyAddress: fields.propertyAddress,
      cadastralNumber: fields.cadastralNumber || null,
      marketValue: parseInt(fields.marketValue),
      currentDebt: parseInt(fields.currentDebt),
      bankAName: fields.bankAName,
      requestedAmount: parseInt(fields.currentDebt), // equals currentDebt
      loanTermDays: parseInt(fields.loanTermDays),
      bankBInfo: fields.bankBInfo || null,
      status: 'pending',
    })
    .returning()

  // Initial status history record (null → pending), for full audit trail
  await db.insert(statusHistory).values({
    applicationId: application.id,
    oldStatus: null,
    newStatus: 'pending',
    changedByUserId: user.id,
    comment: null,
  })

  // Save files
  if (files.length > 0) {
    const uploadDir = join(config.uploadDir, application.id)
    await mkdir(uploadDir, { recursive: true })

    for (const file of files) {
      const filePath = join(uploadDir, file.name)
      await writeFile(filePath, file.data)

      await db.insert(documents).values({
        applicationId: application.id,
        fileName: file.name,
        filePath: filePath,
        fileSize: file.data.length,
        mimeType: file.type,
      })
    }
  }

  // Send email notification to all active admins (fire-and-forget)
  void (async () => {
    try {
      const admins = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.role, 'admin'), eq(users.isActive, true)))

      if (!admins.length) return

      const mailService = useMailService()
      const template = renderMailTemplate('application-created', {
        brokerName: user.fullName,
        applicationId: application.id.slice(0, 8),
        amount: application.requestedAmount,
      })

      await Promise.allSettled(
        admins.map(admin => mailService.send({ to: admin.email, ...template })),
      )
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  })()

  return { data: application }
})
