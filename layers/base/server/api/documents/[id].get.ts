import { eq } from 'drizzle-orm'
import { documents, applications } from '@tranzitum/db'
import { requireAuth } from '../../utils/auth'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({
      statusCode: 400,
      message: 'Document ID is required',
    })
  }

  const db = useDb()

  // Get document with application info
  const [document] = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      filePath: documents.filePath,
      mimeType: documents.mimeType,
      applicationId: documents.applicationId,
      applicationBrokerId: applications.brokerId,
      applicationStatus: applications.status,
    })
    .from(documents)
    .leftJoin(applications, eq(documents.applicationId, applications.id))
    .where(eq(documents.id, documentId))
    .limit(1)

  if (!document) {
    throw createError({
      statusCode: 404,
      message: 'Document not found',
    })
  }

  // Check access
  if (user.role === 'broker' && document.applicationBrokerId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }

  if (user.role === 'investor' && document.applicationStatus !== 'approved') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden',
    })
  }

  // Check if file exists
  try {
    await stat(document.filePath)
  } catch {
    throw createError({
      statusCode: 404,
      message: 'File not found',
    })
  }

  // Set headers
  setHeader(event, 'Content-Type', document.mimeType)
  setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(document.fileName)}"`)

  // Stream file
  return sendStream(event, createReadStream(document.filePath))
})
