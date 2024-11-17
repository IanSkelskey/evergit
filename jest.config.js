module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/tests'],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
	collectCoverage: true,
	collectCoverageFrom: [
		'src/**/*.{ts,js}', // Adjust this path to your source files
	],
	coverageDirectory: 'coverage', // Output directory for coverage reports
	coverageReporters: ['json', 'lcov', 'text', 'clover'], // Coverage formats
};
