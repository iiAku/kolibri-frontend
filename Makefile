build-docker:
	docker build -t vue-frontend .

build:
	docker run --rm -it -v $$(pwd):/shared --workdir /shared -p 8080:8080 vue-frontend npm run build --report

serve:
	docker run --rm -it -v $$(pwd):/shared --workdir /shared -p 8080:8080 vue-frontend npm run serve

bash:
	docker run --rm -it -v $$(pwd):/shared --workdir /shared vue-frontend bash