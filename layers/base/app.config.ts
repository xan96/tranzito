export default defineAppConfig({
  ui: {
    // T-Bank style configuration
    primary: 'primary',
    gray: 'neutral',

    // Button styles
    button: {
      base: 'font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      rounded: 'rounded-[8px]',
      size: {
        xs: 'text-xs px-2.5 py-1.5',
        sm: 'text-sm px-3 py-2',
        md: 'text-sm px-4 py-2.5',
        lg: 'text-base px-5 py-3',
        xl: 'text-base px-6 py-3.5',
      },
      variant: {
        solid: 'bg-primary-400 hover:bg-primary-500 active:bg-primary-600 text-gray-900 shadow-none',
        outline: 'bg-transparent hover:bg-gray-100 text-gray-900 ring-1 ring-gray-300',
        soft: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
        link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
      },
      default: {
        size: 'md',
        variant: 'solid',
        color: 'primary',
      },
    },

    // Input styles
    input: {
      base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none transition-colors duration-200',
      rounded: 'rounded-[8px]',
      placeholder: 'placeholder-gray-400',
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-base px-4 py-3',
        lg: 'text-base px-4 py-4',
        xl: 'text-lg px-5 py-4',
      },
      color: {
        white: {
          outline: 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-400',
        },
      },
      variant: {
        outline: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-400',
        none: 'bg-transparent focus:ring-0',
      },
      default: {
        size: 'md',
        color: 'white',
        variant: 'outline',
      },
    },

    // Card styles
    card: {
      base: 'overflow-hidden',
      rounded: 'rounded-[12px]',
      shadow: 'shadow-sm',
      body: {
        base: '',
        padding: 'p-5',
      },
      header: {
        base: 'border-b border-gray-200',
        padding: 'px-5 py-4',
      },
      footer: {
        base: 'border-t border-gray-200',
        padding: 'px-5 py-4',
      },
    },

    // Badge styles
    badge: {
      base: 'inline-flex items-center font-medium',
      rounded: 'rounded-full',
      size: {
        xs: 'text-xs px-2 py-0.5',
        sm: 'text-xs px-2.5 py-1',
        md: 'text-sm px-3 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
      variant: {
        solid: 'bg-{color}-500 text-white',
        outline: 'bg-transparent text-{color}-500 ring-1 ring-inset ring-{color}-500',
        soft: 'bg-{color}-50 text-{color}-700',
        subtle: 'bg-{color}-100 text-{color}-800',
      },
    },

    // Modal styles
    modal: {
      base: 'relative text-left overflow-hidden flex flex-col',
      rounded: 'rounded-[16px]',
      shadow: 'shadow-xl',
      width: 'sm:max-w-lg',
      padding: 'p-6',
    },

    // Tabs styles
    tabs: {
      list: {
        base: 'relative flex items-center gap-1',
        rounded: 'rounded-[8px]',
        background: 'bg-gray-100',
        padding: 'p-1',
        marker: {
          base: 'absolute rounded-[6px] shadow-sm',
          background: 'bg-white',
        },
        tab: {
          base: 'relative z-10 flex items-center justify-center font-medium transition-colors duration-200',
          rounded: 'rounded-[6px]',
          padding: 'px-4 py-2',
          size: {
            xs: 'text-xs',
            sm: 'text-sm',
            md: 'text-sm',
            lg: 'text-base',
          },
          active: 'text-gray-900',
          inactive: 'text-gray-500 hover:text-gray-700',
        },
      },
    },

    // Select styles
    select: {
      base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none',
      rounded: 'rounded-[8px]',
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-base px-4 py-3',
        lg: 'text-base px-4 py-4',
      },
      color: {
        white: {
          outline: 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-400',
        },
      },
      variant: {
        outline: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-400',
      },
      default: {
        size: 'md',
        color: 'white',
        variant: 'outline',
      },
    },

    // Textarea styles
    textarea: {
      base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none transition-colors duration-200',
      rounded: 'rounded-[8px]',
      placeholder: 'placeholder-gray-400',
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-base px-4 py-3',
        lg: 'text-base px-4 py-4',
      },
      color: {
        white: {
          outline: 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-primary-400',
        },
      },
      variant: {
        outline: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-400',
      },
      default: {
        size: 'md',
        color: 'white',
        variant: 'outline',
      },
    },

    // Alert styles
    alert: {
      rounded: 'rounded-[12px]',
      padding: 'p-4',
    },

    // Dropdown styles
    dropdown: {
      rounded: 'rounded-[12px]',
      shadow: 'shadow-lg',
      padding: 'p-1',
      item: {
        rounded: 'rounded-[8px]',
        padding: 'px-3 py-2',
      },
    },
  },
})
