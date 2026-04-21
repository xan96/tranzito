<script setup lang="ts">
interface UploadedFile {
  id?: string
  name: string
  size: number
  file?: File
}

interface Props {
  modelValue?: UploadedFile[]
  label?: string
  accept?: string
  maxSize?: number // in bytes
  multiple?: boolean
  required?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  accept: '.pdf,.jpg,.jpeg,.png',
  maxSize: 10 * 1024 * 1024, // 10MB
  multiple: true,
})

const emit = defineEmits<{
  'update:modelValue': [files: UploadedFile[]]
}>()

const fileInput = ref<HTMLInputElement>()
const dragOver = ref(false)
const localError = ref('')

// Map extensions to MIME types so Android opens the Files picker
// (Downloads/Drive/SD) instead of forcing camera/gallery-only intent.
const EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
}

const inputAccept = computed(() => {
  const tokens = props.accept.split(',').map(t => t.trim()).filter(Boolean)
  const out = new Set<string>()
  for (const t of tokens) {
    if (t.startsWith('.')) {
      // Map extension to MIME — Android/iOS pickers work reliably only with MIME.
      // Keep extension as fallback only if no MIME mapping exists.
      const mime = EXT_TO_MIME[t.toLowerCase()]
      if (mime) out.add(mime)
      else out.add(t.toLowerCase())
    } else {
      out.add(t)
    }
  }
  return Array.from(out).join(',')
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File): string | null {
  if (file.size > props.maxSize) {
    return `Файл слишком большой. Максимум: ${formatSize(props.maxSize)}`
  }

  const allowedTypes = props.accept.split(',').map((t) => t.trim().toLowerCase())
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`

  if (!allowedTypes.includes(ext)) {
    return `Недопустимый тип файла. Разрешены: ${props.accept}`
  }

  return null
}

function handleFiles(files: FileList | null) {
  if (!files) return

  localError.value = ''
  const newFiles: UploadedFile[] = [...props.modelValue]

  for (const file of files) {
    const error = validateFile(file)
    if (error) {
      localError.value = error
      continue
    }

    newFiles.push({
      name: file.name,
      size: file.size,
      file,
    })
  }

  emit('update:modelValue', props.multiple ? newFiles : newFiles.slice(-1))
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  handleFiles(event.dataTransfer?.files ?? null)
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement
  handleFiles(target.files)
  target.value = ''
}

function removeFile(index: number) {
  const newFiles = [...props.modelValue]
  newFiles.splice(index, 1)
  emit('update:modelValue', newFiles)
}

function openPicker() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="t-file-upload">
    <label v-if="label" class="t-file-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Drop zone -->
    <div
      class="t-file-dropzone"
      :class="{ 'is-dragover': dragOver, 'has-error': error || localError }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="handleDrop"
      @click="openPicker"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="inputAccept"
        :multiple="multiple"
        class="hidden"
        @change="handleChange"
      />
      <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600">
        Нажмите или перетащите файлы
      </p>
      <p class="text-xs text-gray-400 mt-1">
        {{ accept }} до {{ formatSize(maxSize) }}
      </p>
    </div>

    <!-- Error -->
    <Transition name="error-slide">
      <p v-if="error || localError" class="t-file-error">
        {{ error || localError }}
      </p>
    </Transition>

    <!-- File list -->
    <ul v-if="modelValue.length" class="t-file-list">
      <li v-for="(file, index) in modelValue" :key="index" class="t-file-item">
        <div class="w-9 h-9 rounded-lg bg-[#428bf9]/10 flex items-center justify-center flex-shrink-0">
          <UIcon name="i-heroicons-document" class="w-5 h-5 text-[#428bf9]" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ file.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatSize(file.size) }}
          </p>
        </div>
        <button
          type="button"
          class="t-file-remove"
          @click.stop="removeFile(index)"
        >
          <UIcon name="i-heroicons-x-mark" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.t-file-upload {
  @apply mb-4;
}

.t-file-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.t-file-dropzone {
  @apply border-2 border-dashed border-gray-300 rounded-xl p-6;
  @apply flex flex-col items-center justify-center;
  @apply cursor-pointer transition-colors;
  @apply hover:border-primary-400 hover:bg-primary-50/50;
}

.t-file-dropzone.is-dragover {
  @apply border-primary-500 bg-primary-50;
}

.t-file-dropzone.has-error {
  @apply border-transparent;
  background-color: #fee2e2;
}

.t-file-error {
  @apply mt-2 text-sm font-medium;
  color: #ef4444;
}

.t-file-list {
  @apply mt-3 space-y-2;
}

.t-file-item {
  @apply flex items-center gap-3 p-3 bg-gray-50 rounded-lg;
}

.t-file-remove {
  @apply p-1 text-gray-400 hover:text-red-500 transition-colors;
}

/* Error transition */
.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.2s ease-out;
  overflow: hidden;
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.error-slide-enter-to,
.error-slide-leave-from {
  opacity: 1;
  max-height: 50px;
}
</style>
