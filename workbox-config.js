module.exports = {
	globDirectory: 'public/',
	globPatterns: [
		'**/*.{ico,html,json,css,js}',
		'src/**/*.{png,jpg}'
	],
	swSrc: 'public/sw-base.js',
	swDest: 'public/service-worker.js'
};