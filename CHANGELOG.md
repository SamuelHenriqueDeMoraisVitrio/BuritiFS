# [1.1.0](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/compare/v1.0.0...v1.1.0) (2026-04-06)


### Bug Fixes

* **ci:** downgrade actions/checkout from v6 to v4 ([a842c36](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/a842c367b61cd26b6855691d9968e1103c803b29))


### Features

* **editor:** add toast notifications, active file highlight, and reset ([7a34f1c](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/7a34f1c19f69a48d8bb3acb68362946004c22f3c))
* **editor:** prevent duplicate file/folder creation with existence check ([c9ed819](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/c9ed819e0e73328ed4125e89fafd12feeba2af4c))
* **examples/editor:** add context menu for file explorer actions ([2b42c36](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/2b42c36534c4b787aa3e63d4f96b34ab491dd970))
* **examples/editor:** add Tailwind CSS v4 support ([2453683](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/2453683862ea00a3113c5009b7e14952f0ee4514))
* **examples/editor:** implement file explorer and editor UI ([4371f5e](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/4371f5e52aa968ee2b83999cdd2b942c7d0c6bf5))
* **examples/editor:** sync editor state with external file system changes ([60e9ee8](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/60e9ee85a9b1fb0cdfc074e71b2fee0c29af04d8))

# 1.0.0 (2026-04-06)


### Bug Fixes

* **react:** add fallback for undefined error in useExplorer ([b1dd1fa](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/b1dd1fa94b16893cd4e27d4541b71bc81be21b78))
* **storage:** apply sanitized path after validation ([56d3e96](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/56d3e96a13fa88bdfe46cdcdae4e37185cdd8f7d))
* **storage:** guard recoverOrphans against missing asyncIterator support ([2dbd6f8](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/2dbd6f8f521acb8c06052d4c7485a18664912be8))
* **storage:** handle root path in recursive cursor range ([1a7c04b](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/1a7c04b1c9bc8709c0e83bfcaefe1a9c14505a72))


### Features

* **explorer:** add copy method to ExplorerFile and ExplorerFolder ([a1dcf6c](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/a1dcf6c11949767f9dfeddd7ddf79798e5282fdf))
* **explorer:** add delete method to ExplorerFile and ExplorerFolder ([886beda](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/886beda4517e6767ff65dc54077c1700f4545f1d))
* **explorer:** add delete method to ExplorerTree ([5a5bbf0](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/5a5bbf09e570376abace442ad337ede24d587d9a))
* **explorer:** add exists and size methods ([f4a8508](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/f4a85085ea1d68fe33ea32e8f4d72e7e8cd89407))
* **explorer:** add info method to File, Folder, and Tree ([8a07c7d](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/8a07c7dfd2ba8176abf2c31a8d27202a30a1a9ab))
* **explorer:** add list method to Tree and Folder ([6185feb](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/6185feb5187442c6138acc35d47e5f6ef417abc9))
* **explorer:** add move method with merge and priority support ([dbc23d7](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/dbc23d7388f2f80335b47707ee93f2c16a895152))
* **explorer:** add pub/sub notification system to ExplorerTree ([5aa1822](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/5aa18222e803afcb6dd9deb29b6d54fadf589f9a))
* **explorer:** add rename method and fix move to update self ([5b6a713](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/5b6a7130a39ca087209af9325217d0c655b8da3d))
* **indexDB:** extension is new index in DB. ([de76632](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/de766320c5494eda1d3acd9ee58099bb83195a0e))
* **index:** export Explorer classes and types from public API ([06fd3ee](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/06fd3ee37271d01ad777fc579adb66dd02ab95af))
* **react:** add useAction hook export ([4e18e86](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/4e18e868ab7c3a10a73c3fcc8dacd3bd2c01e8f6))
* **react:** add useFolder hook export ([af35a32](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/af35a32ebb82d4c70d109cd25822e31d4484f072))
* **storage:** add listNodes method with pagination and filtering support ([b897280](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/b897280de781ab70c3cb12aca0b9c3764603e370))
* **storage:** add removeNode method and make getSource non-nullable ([71de4e2](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/71de4e2aaf7bbce999e9bc1bf0e601535a21450b))
* **utils:** add path sanitization and validation function ([bd4e65c](https://github.com/SamuelHenriqueDeMoraisVitrio/BuritiFS/commit/bd4e65c6c8c8e48dda92f14f3fc4289966b0cfda))
