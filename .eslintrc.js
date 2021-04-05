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
		'ecmaVersion': 2017
	},
	rules: {
		// Common
		'semi': [ 'warn', 'never' ],
		'quotes': [ 'warn', 'single' ],
		'indent': [ 'warn', 'tab', {
			'SwitchCase': 1
		}],
		'no-console': 'off',
		'no-empty': [ 'warn', {
			'allowEmptyCatch': true
		}],
		'no-trailing-spaces': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'object-curly-spacing': [ 'warn', 'always', {
			'arraysInObjects': true,
			'objectsInObjects': true
		}],
		'array-bracket-spacing': [ 'warn', 'always', {
			'singleValue': true,
			'objectsInArrays': false,
			'arraysInArrays': false
		}],

		// Vue
		'vue/max-attributes-per-line': 'off',
		'vue/component-name-in-template-casing': [ 'error', 'kebab-case' ],
		'vue/html-indent': [ 'warn', 'tab', {
			'attribute': 1,
			'baseIndent': 1,
			'closeBracket': 0,
			'alignAttributesVertically': true,
			'ignores': []
		}],
		'vue/no-v-html': 'off',
		'vue/no-parsing-error': 'off',
		'vue/html-closing-bracket-newline': [ 'warn', {
			'singleline': 'never',
			'multiline': 'never'
		}],
		'vue/singleline-html-element-content-newline': [ 'warn', {
			'ignoreWhenNoAttributes': true,
			'ignoreWhenEmpty': true,
			'ignores': [ 'pre', 'textarea', 'th', 'td', 'span' ]
		}]
	}
}
