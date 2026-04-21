/** Shared tone system for metric/stat cards. */
export type Tone = 'default' | 'amber' | 'green' | 'red' | 'blue'

const VALUE_CLASSES: Record<Tone, string> = {
  default: 'text-gray-900',
  amber: 'text-amber-600',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-[#428bf9]',
}

const LABEL_CLASSES: Record<Tone, string> = {
  default: 'text-gray-500',
  amber: 'text-amber-600',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-[#428bf9]',
}

export function useToneClasses() {
  return {
    toneValue: (tone: Tone) => VALUE_CLASSES[tone],
    toneLabel: (tone: Tone) => LABEL_CLASSES[tone],
  }
}
