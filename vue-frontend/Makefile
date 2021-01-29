build-docker:
	docker build -t vue-frontend .

build:
	docker run --rm -it -v $$(pwd)/../:/shared -p 8080:8080 vue-frontend bash -c 'cd /shared/vue-frontend/ && npm run build --report'

serve:
	docker run --rm -it -v $$(pwd)/../:/shared -p 8080:8080 vue-frontend bash -c 'cd /shared/vue-frontend/ && npm run serve'

bash:
	docker run --rm -it -v $$(pwd)/../:/shared vue-frontend bash -c 'cd /shared/vue-frontend/ && bash'

deploy-gh-pages:
	rm -rf dist/
	docker run --rm -it -v $$(pwd)/../:/shared vue-frontend bash -c 'cd /shared/vue-frontend/ && npm run build'
	cd dist && git init
	cd dist && git add .
	cd dist && git commit -m "Github Pages Build"
	cd dist && git remote add origin git@github.com:hover-labs/kolibri.git
	cd dist && git push --force origin master:gh-pages
