import Aura from '@primeuix/themes/aura'
// import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'

// PrimeVue configuration
export default {
  ripple: true,
  locale: {
    firstDayOfWeek: 0,
    dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'],
    dayNamesMin: ['日', '月', '火', '水', '木', '金', '土'],
    monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthNamesShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    today: '今日',
    clear: 'クリア',
    weekHeader: '週'
  },
  theme: {
    preset: definePreset(Aura, {
      semantic: {
        primary: {
          50: '#E8EDFF',
          100: '#C5D1FF',
          200: '#A2B5FF',
          300: '#7F99FF',
          400: '#5C7DFF',
          500: '#2964F1', // Key Color
          600: '#1F4DB8',
          700: '#15367F',
          800: '#0B1F46',
          900: '#050F1F',
          950: '#020710'
        },
        colorScheme: {
          light: {
            primary: {
              color: '#2964F1', // Key Color
              inverseColor: '#ffffff',
              hoverColor: '#1F4DB8',
              activeColor: '#15367F'
            }
          },
          dark: {
            primary: {
              color: '#5C7DFF',
              inverseColor: '#020710',
              hoverColor: '#7F99FF',
              activeColor: '#A2B5FF'
            },
          }
        }
      }
    }),
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue'
      }
    }
  } 
}

