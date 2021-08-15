const color = require('tinycolor2')

//
function lighten(col, amount = 5) {
  return color(col).lighten(amount).toString()
}

function darken(col, amount = 5) {
  return color(col).darken(amount).toString()
}

//
const theme = {
  night: {
    light: '#4C566A', // UI elements like indent- and wrap guide marker
    DEFAULT: '#434C5E', // selection- and text highlighting color
    dark: '#3B4252', // elevated, more prominent or focused UI elements
    darker: '#2E3440', // elements background
  },

  snow: {
    darker: '#82858c',
    dark: '#adb2ba',
    DEFAULT: '#D8DEE9',
    light: '#E5E9F0',
    lighter: '#ECEFF4'
  },

  frost: {
    green: '#9fc6c5', // stand out and get more visual attention
    cyan: '#94c4d1', // primary UI elements with main usage purposes
    gray: '#81A1C1', // secondary UI elements that also require more visual attention than other elements
    blue: '#94afd1' // tertiary UI elements that require more visual attention
  },

  aurora: {
    red: '#f0a8af', // errors
    orange: '#d99e8c', // rarely used for UI elements
    yellow: '#f0d8a8', // warnings
    green: '#A3BE8C', // success
    pink: '#c2a3bc' // rarely used for UI elements
  },

  primary: {
    light: lighten('#7db8e8', 10),
    DEFAULT: '#7db8e8',
    dark: darken('#7db8e8', 10)
  }
}

// See DEFAULT config https://github.com/tailwindcss/tailwindcss/blob/master/stubs/DEFAULTConfig.stub.js
module.exports = {
  mode: 'jit',
  theme: {
    screens: {
      xl: { max: '2000px' },
      lg: { max: '1800px' },
      md: { max: '1400px' },
      sm: { max: '1200px' },
    },

    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Arial',
          'sans-serif',
        ],
        title: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Arial',
          'sans-serif',
        ]
      },

      // https://javisperez.github.io/tailwindcolorshades/
      colors: {
        // Polar Night
        night: theme.night,
        background: '#242933',

        menus: {
          light: lighten(theme.night.darker, 3),
          DEFAULT: theme.night.darker,
          dark: darken(theme.night.darker, 3),
        },
        input: {
          light: lighten(theme.night.dark),
          DEFAULT: theme.night.dark,
          dark: darken(theme.night.dark),
        },
        button: {
          light: lighten(theme.night.dark),
          DEFAULT: theme.night.dark,
          dark: darken(theme.night.dark),
        },

        // Snow Storm

        snow: theme.snow,

        // Frost

        frost: theme.frost,

        blue: {
          light: lighten(theme.frost.blue),
          DEFAULT: theme.frost.blue,
          dark: darken(theme.frost.blue),
        },

        // Aurora

        aurora: theme.aurora,

        danger: {
          light: lighten(theme.aurora.red),
          DEFAULT: theme.aurora.red,
          dark: darken(theme.aurora.red)
        },

        success: {
          light: lighten(theme.aurora.green),
          DEFAULT: theme.aurora.green,
          dark: darken(theme.aurora.green),
        },

        warning: {
          light: lighten(theme.aurora.yellow),
          DEFAULT: theme.aurora.yellow,
          dark: darken(theme.aurora.yellow),
        },

        //

        common: {
          light: '#ECEFF4',
          DEFAULT: '#E5E9F0',
          dark: '#D8DEE9',
        },

        dark: {
          100: '#65676A',
          200: '#505255',
          300: '#3A3D40',
          400: '#25272B',
          500: '#0f1216',
          600: '#0E1014',
          700: '#0C0F12',
          800: '#0B0D10',
          900: '#0A0C0E',
        },

        navbar: {
          100: '#E6E6E7',
          200: '#C1C1C3',
          300: '#9B9C9E',
          400: '#515156',
          500: '#06070D',
          600: '#05060C',
          700: '#040408',
          800: '#030306',
          900: '#020204',
        },

        primary: {
          light: lighten('#7db8e8', 10),
          DEFAULT: '#7db8e8',
          dark: darken('#7db8e8', 10)
        },
      },
    },
  },
  corePlugins: {
    container: false,
  },
}
