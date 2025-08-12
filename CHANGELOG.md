## [1.0.2](https://github.com/geostyler/geostyler-rest/compare/v1.0.1...v1.0.2) (2025-08-12)

### Bug Fixes

* **deps:** update dependency geostyler-sld-parser to v8 ([47d2735](https://github.com/geostyler/geostyler-rest/commit/47d27352aa4acb48d1873a3478d4738d173731a3))
* **ogc api:** json parse lyrx style before passing to style parser ([6529742](https://github.com/geostyler/geostyler-rest/commit/652974233fb2828ebc5c03e14437f6ce474cf7e1))

## [1.0.1](https://github.com/geostyler/geostyler-rest/compare/v1.0.0...v1.0.1) (2025-07-10)

### Bug Fixes

* configure swagger basepath via env variable ([fd2ca9f](https://github.com/geostyler/geostyler-rest/commit/fd2ca9f392a3e3a68015cfe5f4a0cff18501b3b3))

## 1.0.0 (2025-07-10)

### ⚠ BREAKING CHANGES

* switch to bun-elysia-setup and change endpoints

Co-authored-by: Jan Suleiman <jansule@users.noreply.github.com>

### Features

*  switch to bun and elysia ([#99](https://github.com/geostyler/geostyler-rest/issues/99)) ([1b17af3](https://github.com/geostyler/geostyler-rest/commit/1b17af32819fd6e0cb149c70cf821570098451a9))
* add geostyler format ([08458dc](https://github.com/geostyler/geostyler-rest/commit/08458dc9045f4adcb208c82a63b21254d1debc21))
* add readonly ogc api styles ([a858314](https://github.com/geostyler/geostyler-rest/commit/a858314af712b05c08cd1094106aff2a0b1bba0e))
* add rudimentary content-type/accept header handling ([a2e0d50](https://github.com/geostyler/geostyler-rest/commit/a2e0d5080f610911c7ad5bc0fd381bdcf3f05799))
* add sourceFormat and targetFormat return error codes when unknown ([2d8bb5f](https://github.com/geostyler/geostyler-rest/commit/2d8bb5fbf04577db7f0dcb424c2de726546f1c24))
* add support for the resources/manage-resources conformance classes ([39b951d](https://github.com/geostyler/geostyler-rest/commit/39b951d82ec84565affc1821e194bb4f63f7af24))
* fixed some bugs, improved content negotiation ([ba5b989](https://github.com/geostyler/geostyler-rest/commit/ba5b98912b69c23bc6caf6edd3195c2e768af844))
* implement authentication support ([1f5bcf9](https://github.com/geostyler/geostyler-rest/commit/1f5bcf9ec9e1dd6e0320d949d9a24ed8ebc82440))
* implement manage-styles conformance class ([8e925cd](https://github.com/geostyler/geostyler-rest/commit/8e925cd79065d8fb6543389914531633ab46ec80))
* support all mime types when uploading styles ([7cbc852](https://github.com/geostyler/geostyler-rest/commit/7cbc85236f1302bd15b586905f259e028620f839))
* support configuring CORS options ([b0fd823](https://github.com/geostyler/geostyler-rest/commit/b0fd823730d09288a979f375771df8cd08cdacff))

### Bug Fixes

* **deps:** update dependency geostyler-cql-parser to v4.1.0 ([f85d5ca](https://github.com/geostyler/geostyler-rest/commit/f85d5ca861be47d37b91601082746e5feac9cd94))
* parse input even on identical source and target formats ([2dd7a1d](https://github.com/geostyler/geostyler-rest/commit/2dd7a1d60d8bb9a0a39c375242e8d07cfb65960f))
* set proper identifier for json conformance ([75198ea](https://github.com/geostyler/geostyler-rest/commit/75198eabd32546f5fcfd3896632c346709c02ffe))
