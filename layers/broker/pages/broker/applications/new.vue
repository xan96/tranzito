<script setup lang="ts">
definePageMeta({
  layout: 'broker',
  middleware: ['auth', 'role-broker'],
})

const router = useRouter()

const STORAGE_KEY = 'tranzitum-application-draft'

// Restore state from sessionStorage
const savedState = import.meta.client ? sessionStorage.getItem(STORAGE_KEY) : null
const initialState = savedState ? JSON.parse(savedState) : null

const currentStep = ref(initialState?.currentStep || 0)
const loading = ref(false)

const steps = [
  { title: 'Данные заёмщика', description: 'Укажите контактную информацию' },
  { title: 'Данные недвижимости', description: 'Информация об объекте залога' },
  { title: 'Параметры займа', description: 'Сумма и срок' },
  { title: 'Документы', description: 'Загрузите необходимые файлы' },
]

// Form data
const form = reactive({
  // Step 1: Borrower
  borrowerName: initialState?.form?.borrowerName || '',
  borrowerPhone: initialState?.form?.borrowerPhone || '',
  borrowerEmail: initialState?.form?.borrowerEmail || '',

  // Step 2: Property
  propertyAddress: initialState?.form?.propertyAddress || '',
  cadastralNumber: initialState?.form?.cadastralNumber || '',
  marketValue: initialState?.form?.marketValue || 15000000,
  currentDebt: initialState?.form?.currentDebt || 5000000,
  bankAName: initialState?.form?.bankAName || '',
  bankANameCustom: initialState?.form?.bankANameCustom || '',

  // Step 3: Loan
  loanTermDays: initialState?.form?.loanTermDays || LOAN_TERM_DEFAULT_DAYS,
  bankBName: initialState?.form?.bankBName || '',
  bankBNameCustom: initialState?.form?.bankBNameCustom || '',

  // Step 4: Documents (can't persist File objects)
  documents: [] as Array<{ name: string; size: number; file?: File }>,
})

// Save state to sessionStorage on changes
function saveState() {
  if (!import.meta.client) return
  const state = {
    currentStep: currentStep.value,
    form: {
      borrowerName: form.borrowerName,
      borrowerPhone: form.borrowerPhone,
      borrowerEmail: form.borrowerEmail,
      propertyAddress: form.propertyAddress,
      cadastralNumber: form.cadastralNumber,
      marketValue: form.marketValue,
      currentDebt: form.currentDebt,
      bankAName: form.bankAName,
      bankANameCustom: form.bankANameCustom,
      loanTermDays: form.loanTermDays,
      bankBName: form.bankBName,
      bankBNameCustom: form.bankBNameCustom,
    },
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Watch for changes and save
watch([currentStep, () => ({ ...form })], saveState, { deep: true })

// Auto-adjust currentDebt if marketValue is lowered
watch(() => form.marketValue, (newMarketValue) => {
  if (form.currentDebt > newMarketValue) {
    form.currentDebt = newMarketValue
  }
})

// Validation errors
const errors = reactive({
  borrowerName: '',
  borrowerPhone: '',
  borrowerEmail: '',
  propertyAddress: '',
  cadastralNumber: '',
  marketValue: '',
  currentDebt: '',
  bankAName: '',
  documents: '',
})

// Track which fields have been touched (blurred)
const touched = reactive({
  borrowerName: false,
  borrowerPhone: false,
  borrowerEmail: false,
  propertyAddress: false,
  marketValue: false,
  currentDebt: false,
  bankAName: false,
})

// Validation helpers
function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10
}

function validateEmail(email: string): boolean {
  if (!email) return true // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateFio(name: string): boolean {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
}

// Validate single field on blur
function validateField(field: keyof typeof touched) {
  touched[field] = true

  switch (field) {
    case 'borrowerName':
      if (!form.borrowerName.trim()) {
        errors.borrowerName = 'Укажите ФИО'
      } else if (!validateFio(form.borrowerName)) {
        errors.borrowerName = 'Укажите фамилию и имя через пробел'
      } else {
        errors.borrowerName = ''
      }
      break

    case 'borrowerPhone':
      if (!form.borrowerPhone.trim()) {
        errors.borrowerPhone = 'Укажите телефон'
      } else if (!validatePhone(form.borrowerPhone)) {
        errors.borrowerPhone = 'Некорректный номер телефона'
      } else {
        errors.borrowerPhone = ''
      }
      break

    case 'borrowerEmail':
      if (!validateEmail(form.borrowerEmail)) {
        errors.borrowerEmail = 'Некорректный email'
      } else {
        errors.borrowerEmail = ''
      }
      break

    case 'propertyAddress':
      if (!form.propertyAddress.trim()) {
        errors.propertyAddress = 'Укажите адрес объекта'
      } else {
        errors.propertyAddress = ''
      }
      break

    case 'marketValue':
      if (!form.marketValue || form.marketValue < 1000000) {
        errors.marketValue = 'Укажите рыночную стоимость (мин. 1 000 000)'
      } else {
        errors.marketValue = ''
      }
      break

    case 'currentDebt':
      if (!form.currentDebt || form.currentDebt < 100000) {
        errors.currentDebt = 'Укажите текущий долг (мин. 100 000)'
      } else if (form.currentDebt > form.marketValue) {
        errors.currentDebt = 'Долг не может превышать рыночную стоимость'
      } else {
        errors.currentDebt = ''
      }
      break

    case 'bankAName':
      if (!form.bankAName) {
        errors.bankAName = 'Выберите банк'
      } else if (form.bankAName === 'other' && !form.bankANameCustom.trim()) {
        errors.bankAName = 'Введите название банка'
      } else {
        errors.bankAName = ''
      }
      break
  }
}

// Step validators
function validateStep(step: number): boolean {
  let isValid = true

  if (step === 0) {
    // Step 1: Borrower
    if (!form.borrowerName.trim()) {
      errors.borrowerName = 'Укажите ФИО'
      isValid = false
    } else if (!validateFio(form.borrowerName)) {
      errors.borrowerName = 'Укажите фамилию и имя через пробел'
      isValid = false
    } else {
      errors.borrowerName = ''
    }

    if (!form.borrowerPhone.trim()) {
      errors.borrowerPhone = 'Укажите телефон'
      isValid = false
    } else if (!validatePhone(form.borrowerPhone)) {
      errors.borrowerPhone = 'Некорректный номер телефона'
      isValid = false
    } else {
      errors.borrowerPhone = ''
    }

    if (!validateEmail(form.borrowerEmail)) {
      errors.borrowerEmail = 'Некорректный email'
      isValid = false
    } else {
      errors.borrowerEmail = ''
    }
  }

  if (step === 1) {
    // Step 2: Property
    if (!form.propertyAddress.trim()) {
      errors.propertyAddress = 'Укажите адрес объекта'
      isValid = false
    } else {
      errors.propertyAddress = ''
    }

    if (!form.marketValue || form.marketValue < 1000000) {
      errors.marketValue = 'Укажите рыночную стоимость (мин. 1 000 000)'
      isValid = false
    } else {
      errors.marketValue = ''
    }

    if (!form.currentDebt || form.currentDebt < 100000) {
      errors.currentDebt = 'Укажите текущий долг (мин. 100 000)'
      isValid = false
    } else if (form.currentDebt > form.marketValue) {
      errors.currentDebt = 'Долг не может превышать рыночную стоимость'
      isValid = false
    } else {
      errors.currentDebt = ''
    }

    if (!form.bankAName) {
      errors.bankAName = 'Выберите банк'
      isValid = false
    } else if (form.bankAName === 'other' && !form.bankANameCustom.trim()) {
      errors.bankAName = 'Введите название банка'
      isValid = false
    } else {
      errors.bankAName = ''
    }
  }

  if (step === 3) {
    // Step 4: Documents
    if (form.documents.length === 0) {
      errors.documents = 'Загрузите хотя бы один документ'
      isValid = false
    } else {
      errors.documents = ''
    }
  }

  return isValid
}

function handleStepChange(newStep: number) {
  // Only validate when moving forward
  if (newStep > currentStep.value) {
    if (!validateStep(currentStep.value)) {
      return // Don't proceed if validation fails
    }
  }
  currentStep.value = newStep
}

// Phone input ref
const phoneInputRef = ref()

// Auto-fill +7 prefix on phone focus
function handlePhoneFocus() {
  if (!form.borrowerPhone) {
    form.borrowerPhone = '+7 ('
    // Small delay to ensure value is rendered before setting cursor
    setTimeout(() => {
      phoneInputRef.value?.setCursor(4)
    }, 10)
  }
}

// Format phone number as user types: +7 (XXX) XXX-XX-XX
watch(() => form.borrowerPhone, (newVal, oldVal) => {
  if (!newVal || newVal.length < (oldVal?.length || 0)) return // Skip on delete

  // Extract only digits after +7
  const digits = newVal.replace(/\D/g, '').slice(1) // Remove country code

  let formatted = '+7 ('

  if (digits.length > 0) {
    formatted += digits.slice(0, 3)
  }
  if (digits.length >= 3) {
    formatted += ') '
  }
  if (digits.length > 3) {
    formatted += digits.slice(3, 6)
  }
  if (digits.length >= 6) {
    formatted += '-'
  }
  if (digits.length > 6) {
    formatted += digits.slice(6, 8)
  }
  if (digits.length >= 8) {
    formatted += '-'
  }
  if (digits.length > 8) {
    formatted += digits.slice(8, 10)
  }

  if (formatted !== newVal) {
    form.borrowerPhone = formatted
    setTimeout(() => {
      phoneInputRef.value?.setCursor(formatted.length)
    }, 0)
  }
})

// Check if current step is valid (for disabling button)
const isCurrentStepValid = computed(() => {
  if (currentStep.value === 0) {
    const hasValidName = form.borrowerName.trim() && validateFio(form.borrowerName)
    const hasValidPhone = form.borrowerPhone.trim() && validatePhone(form.borrowerPhone)
    const hasValidEmail = !form.borrowerEmail || validateEmail(form.borrowerEmail)
    return hasValidName && hasValidPhone && hasValidEmail
  }

  if (currentStep.value === 1) {
    const hasAddress = !!form.propertyAddress.trim()
    const hasMarketValue = form.marketValue >= 1000000
    const hasDebt = form.currentDebt >= 100000
    const hasBank = !!form.bankAName && (form.bankAName !== 'other' || !!form.bankANameCustom.trim())
    return hasAddress && hasMarketValue && hasDebt && hasBank
  }

  if (currentStep.value === 2) {
    return true // No required fields on step 3
  }

  if (currentStep.value === 3) {
    return form.documents.length > 0
  }

  return true
})

const loanTermOptions = LOAN_TERM_OPTIONS

const bankOptions = [
  { value: 'sberbank', label: 'Сбербанк' },
  { value: 'vtb', label: 'ВТБ' },
  { value: 'gazprombank', label: 'Газпромбанк' },
  { value: 'alfabank', label: 'Альфа-Банк' },
  { value: 'rosbank', label: 'Росбанк' },
  { value: 'raiffeisen', label: 'Райффайзенбанк' },
  { value: 'tinkoff', label: 'Т-Банк' },
  { value: 'otkritie', label: 'Открытие' },
  { value: 'sovcombank', label: 'Совкомбанк' },
  { value: 'psb', label: 'ПСБ' },
  { value: 'rosselhoz', label: 'Россельхозбанк' },
  { value: 'mkb', label: 'МКБ' },
  { value: 'unicredit', label: 'ЮниКредит Банк' },
  { value: 'dom-rf', label: 'Банк ДОМ.РФ' },
  { value: 'other', label: 'Другой' },
]

const requestedAmount = computed(() => {
  const debt = parseInt(form.currentDebt) || 0
  return new Intl.NumberFormat('ru-RU').format(debt)
})

async function handleSubmit() {
  // Validate last step before submit
  if (!validateStep(currentStep.value)) {
    return
  }

  loading.value = true

  try {
    // Create FormData for file upload
    const formData = new FormData()

    // Add form fields
    formData.append('borrowerName', form.borrowerName)
    formData.append('borrowerPhone', form.borrowerPhone)
    formData.append('borrowerEmail', form.borrowerEmail)
    formData.append('propertyAddress', form.propertyAddress)
    formData.append('cadastralNumber', form.cadastralNumber)
    formData.append('marketValue', form.marketValue)
    formData.append('currentDebt', form.currentDebt)
    // Send actual bank name (from list or custom)
    const bankName = form.bankAName === 'other'
      ? form.bankANameCustom
      : bankOptions.find(b => b.value === form.bankAName)?.label || form.bankAName
    formData.append('bankAName', bankName)
    formData.append('loanTermDays', String(form.loanTermDays))
    // Send actual bank B name (from list or custom)
    if (form.bankBName) {
      const bankBName = form.bankBName === 'other'
        ? form.bankBNameCustom
        : bankOptions.find(b => b.value === form.bankBName)?.label || form.bankBName
      formData.append('bankBName', bankBName)
    }

    // Add files
    for (const doc of form.documents) {
      if (doc.file) {
        formData.append('documents', doc.file)
      }
    }

    await $fetch('/api/applications', {
      method: 'POST',
      body: formData,
    })

    // Clear saved state on success
    sessionStorage.removeItem(STORAGE_KEY)

    // Invalidate cached list so new application is visible immediately on /broker.
    await refreshNuxtData('api:/api/applications')

    await router.push('/broker')
  } catch (error) {
    console.error('Failed to create application:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <TStepForm
    :current-step="currentStep"
    :steps="steps"
    :loading="loading"
    :disabled="!isCurrentStepValid"
    @update:current-step="handleStepChange"
    @submit="handleSubmit"
  >
    <!-- Step 1: Borrower data -->
    <template #step-0>
      <div class="space-y-4">
        <TInput
          v-model="form.borrowerName"
          label="ФИО полностью"
          placeholder="Иванов Иван Иванович"
          :error="errors.borrowerName"
          required
          @blur="validateField('borrowerName')"
        />
        <TInput
          ref="phoneInputRef"
          v-model="form.borrowerPhone"
          label="Телефон"
          placeholder="+7 (999) 123-45-67"
          :error="errors.borrowerPhone"
          :filter="/[\d+() -]/"
          type="tel"
          show-mask
          required
          @focus="handlePhoneFocus"
          @blur="validateField('borrowerPhone')"
        />
        <TInput
          v-model="form.borrowerEmail"
          label="Email"
          placeholder="email@example.com"
          :error="errors.borrowerEmail"
          type="email"
          @blur="validateField('borrowerEmail')"
        />
      </div>
    </template>

    <!-- Step 2: Property data -->
    <template #step-1>
      <div class="space-y-4">
        <TInput
          v-model="form.propertyAddress"
          label="Адрес объекта"
          placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
          :error="errors.propertyAddress"
          required
          @blur="validateField('propertyAddress')"
        />
        <TInput
          v-model="form.cadastralNumber"
          label="Кадастровый номер"
          placeholder="77:01:0001234:5678"
        />
        <TInputRange
          v-model="form.marketValue"
          label="Рыночная стоимость"
          suffix="₽"
          :min="1000000"
          :max="100000000"
          :step="50000"
          :error="errors.marketValue"
          required
        />
        <TInputRange
          v-model="form.currentDebt"
          label="Текущий долг перед банком"
          suffix="₽"
          :min="100000"
          :max="form.marketValue"
          :step="50000"
          :error="errors.currentDebt"
          required
        />
        <TSelect
          v-model="form.bankAName"
          label="Банк-залогодержатель"
          :options="bankOptions"
          :error="errors.bankAName"
          searchable
          required
        />
        <TInput
          v-if="form.bankAName === 'other'"
          v-model="form.bankANameCustom"
          label="Название банка"
          placeholder="Введите название банка"
          required
        />
      </div>
    </template>

    <!-- Step 3: Loan parameters -->
    <template #step-2>
      <div class="space-y-6">
        <div class="bg-gray-100 rounded-xl p-4">
          <p class="text-sm text-gray-500">
            Сумма займа
          </p>
          <p class="text-xl md:text-2xl font-semibold text-gray-900 leading-tight break-words">
            {{ requestedAmount }} ₽
          </p>
          <p class="text-xs text-gray-400 mt-1">
            Равна текущему долгу
          </p>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-700 mb-3">
            Срок займа
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="option in loanTermOptions"
              :key="option.value"
              type="button"
              class="p-4 rounded-xl border-2 text-center transition-colors"
              :class="form.loanTermDays === option.value
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.loanTermDays = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <TSelect
          v-model="form.bankBName"
          label="Банк Б (если есть одобрение)"
          :options="bankOptions"
          searchable
        />
        <TInput
          v-if="form.bankBName === 'other'"
          v-model="form.bankBNameCustom"
          label="Название банка"
          placeholder="Введите название банка"
        />
      </div>
    </template>

    <!-- Step 4: Documents -->
    <template #step-3>
      <div class="space-y-4">
        <TFileUpload
          v-model="form.documents"
          label="Предварительное одобрение банка Б"
          :error="errors.documents"
          required
        />
        <p class="text-sm text-gray-500">
          Также вы можете приложить выписку ЕГРН и отчёт об оценке
        </p>
      </div>
    </template>
  </TStepForm>
</template>
