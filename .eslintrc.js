module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended'
  ],
  plugins: [
    'vue'
  ],
  globals: {
    _: false
  },
  parserOptions: {
    parser: 'babel-eslint',
    "ecmaVersion": 2017
  },
  rules: {
    // Common
    'semi': ['warn', 'never'],
    'quotes': ['warn', 'single'],
    'indent': ['warn', 4, { "SwitchCase": 1 }],
    'no-console': 'off',
    'no-empty': ['warn', {
      'allowEmptyCatch': true
    }],
    'no-trailing-spaces': 'off',

    // Vue
    'vue/max-attributes-per-line': 'off',
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/html-indent': ['error', 4, {
      "attribute": 4,
      "baseIndent": 1,
      "closeBracket": 0,
      "alignAttributesVertically": true,
      "ignores": []
    }],
    'vue/no-v-html': 'off',
    'vue/no-parsing-error': 'off',
    'vue/html-closing-bracket-newline': ['warn', {
      'singleline': 'never',
      'multiline': 'never'
    }]
  }
}
