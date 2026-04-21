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

const photoInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const dragOver = ref(false)
const localError = ref('')

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

function openPhoto() {
  photoInput.value?.click()
}

function openCamera() {
  cameraInput.value?.click()
}

function openFiles() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="t-file-upload">
    <label v-if="label" class="t-file-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Drop zone (desktop drag & drop + visual anchor) -->
    <div
      class="t-file-dropzone"
      :class="{ 'is-dragover': dragOver, 'has-error': error || localError }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="handleDrop"
      @click="openFiles"
    >
      <UIcon name="i-heroicons-cloud-arrow-up" class="w-8 h-8 text-gray-400" />
      <p class="mt-2 text-sm text-gray-600">
        Перетащите или нажмите, чтобы выбрать файл
      </p>
      <p class="text-xs text-gray-400 mt-1">
        {{ accept }} до {{ formatSize(maxSize) }}
      </p>
    </div>

    <!-- Explicit action buttons. Hidden on desktop via CSS media query. -->
    <div class="t-file-actions">
      <button
        type="button"
        class="t-file-action"
        @click="openFiles"
      >
        <UIcon name="i-heroicons-document" class="w-5 h-5" />
        <span>Файл</span>
      </button>
      <button
        type="button"
        class="t-file-action t-file-action--mobile"
        @click="openPhoto"
      >
        <UIcon name="i-heroicons-photo" class="w-5 h-5" />
        <span>Фото</span>
      </button>
      <button
        type="button"
        class="t-file-action t-file-action--mobile"
        @click="openCamera"
      >
        <UIcon name="i-heroicons-camera" class="w-5 h-5" />
        <span>Камера</span>
      </button>
    </div>

    <!-- Doc input: application/pdf only → Android opens SAF with Downloads/Drive,
         no camera/gallery intent. -->
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      :multiple="multiple"
      class="hidden"
      @change="handleChange"
    />
    <!-- Photo input: image/* without `capture` → system Photo Picker
         (gallery + Downloads-stored images). -->
    <input
      ref="photoInput"
      type="file"
      accept="image/*"
      :multiple="multiple"
      class="hidden"
      @change="handleChange"
    />
    <!-- Camera input: image/* + capture=environment → direct rear camera. -->
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="handleChange"
    />

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

.t-file-actions {
  @apply mt-2 grid grid-cols-3 gap-2;
}

.t-file-action {
  @apply flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg;
  @apply bg-white border border-gray-200 text-sm font-medium text-gray-700;
  @apply hover:bg-gray-50 hover:border-gray-300 transition-colors;
}

/* Hide photo button and collapse the grid on non-touch devices (desktops). */
@media (hover: hover) and (pointer: fine) {
  .t-file-actions {
    @apply grid-cols-1;
  }

  .t-file-action--mobile {
    display: none;
  }
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
