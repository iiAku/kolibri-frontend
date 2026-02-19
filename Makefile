build-docker:
	docker build -t vue-frontend .

build:
	docker run --rm -it \
		-v $$(pwd):/shared \
		--workdir /shared \
		vue-frontend \
		npx nuxi build

build-ipfs:
	docker run --rm -it \
		-v $$(pwd):/shared \
		--workdir /shared \
		-e IPFS_BUILD=1 \
		vue-frontend \
		npx nuxi build

serve:
	docker run --rm -it \
		-v $$(pwd):/shared \
		--workdir /shared \
		-p 3000:3000 \
		vue-frontend \
		npx nuxi dev

bash:
	docker run --rm -it \
		-v $$(pwd):/shared \
		--workdir /shared \
		vue-frontend \
		bash
