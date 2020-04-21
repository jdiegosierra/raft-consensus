SHELL := /bin/bash

# DO NOT CHANGE VERSION NUMBER MANUALLY
VERSION=0.0.1
VERSION_MAJOR:=$(shell echo $(VERSION) | cut -d'.' -f1)
VERSION_MINOR:=$(shell echo $(VERSION) | cut -d'.' -f2)
VERSION_PATCH:=$(shell echo $(VERSION) | cut -d'.' -f3)


# configuration
# -------------

SLUG=pyvincoli
NAME=PyVincoli


# project setup
# -------------

# install pre-commit hook (will execute "make checklist")
setup-pre-commit:
	echo -e '#!/bin/bash\nmake checklist' > .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit

# setup project for development
setup: setup-pre-commit
	poetry env use python3.8
	source .venv/bin/activate && python -m pip install -U pip
	poetry install


# code tasks
# ----------

# run all automatic code tasks (formatting, linting, testing...)
checklist: format lint test-unit-docker

# format files with black, isort and trim
format:
	black .
	# unimport -r .
	isort -rc .
	shopt -sq globstar extglob && trim ./**/*

# lint python code with pycodestyle, pyflakes, mccabe, radon, eradicate and mypy
lint:
	pylama --skip *test*,.venv\*,**/*_pb2.py,*_pb2_grpc.py -l pylint,pycodestyle,pydocstyle,pyflakes,mccabe,radon,eradicate,mypy .
	# pylama --skip *test*,.venv\*,**/*_pb2.py,*_pb2_grpc.py -l mypy .
	bandit -r $(shell pwd) -x $(shell pwd)/.venv/,$(shell pwd)/tests,**/*/test_*.py,**/*/conftest.py

# run unit tests
test-unit:
	pytest pyvincoli/

# run unit tests with docker compose
test-unit-docker:
	@docker build -t pyvincoli-unit-tests --network vincoli.packages -f tests/Dockerfile . &> /dev/null
	@cd tests && docker-compose up -d &> /dev/null
	@cd tests && docker-compose logs -f test
	@cd tests && docker-compose rm -sf test > /dev/null

# run integration tests
test-integration:
	sudo rm -rf logs
	mkdir logs
	touch logs/test1.log logs/test2.log logs/test3.log
	docker-compose up

# starts a configured network
init-network:
	@pytest tests/integration/init.py --disable-pytest-warnings -s

# run all tests
test: test-unit-docker test-integration

# run static type analysis with mypy (strict)
check-types:
	mypy --strict -p pyvincoli

# bump project version
# config file: .bumpversion.cfg
# usage:
# $ make bump-version type=major|minor|patch (default is patch)
type?=patch
bump-version:
	bumpversion $(type)


# documentation
# ---------

# open internal documentation in a web browser
# usage:
# $ make serve-doc port=<port>
# (default port is 9876)
port?=9876
serve-doc:
	killall -9 pdoc
	xdg-open http://localhost:$(port)/pyvincoli
	pdoc --http :$(port) -c show_type_annotations=True pyvincoli


# execution
# ---------

# start node
start:
	@python entrypoint.py


# docker
# ------

# build docker image
docker-build:
	docker build \
		--network vincoli.packages \
		-t $(SLUG):latest \
		-t $(SLUG):$(VERSION_MAJOR) \
		-t $(SLUG):$(VERSION_MAJOR).$(VERSION_MINOR) \
		-t $(SLUG):$(VERSION) \
		.

# start node with docker
# usage:
# $ make docker-start rpc_port=<port> rest_port=<port>
# (defaults are rpc: 50051 and rest: 8000)
rpc_port?=50051
rest_port?=8000
docker-start:
	touch /tmp/pyvincoli-docker.log
	touch /tmp/pyvincoli-console.log
	docker run -d \
		--name $(SLUG) \
		--network host \
		-p $(rpc_port):50051 \
		-p $(rest_port):8000 \
		-e LOGGING_CONSOLE_LEVEL=DEBUG \
		-v /tmp/pyvincoli-docker.log:/app/node.log:rw \
		$(SLUG):$(VERSION)
	docker logs -f pyvincoli &> /tmp/pyvincoli-docker-console.log

# stop and remove the container that's currently running
docker-stop:
	-docker rm -f $(SLUG)

# stop the container that's currently running
docker-pause:
	docker stop $(SLUG)

# resume the node that's currently paused
docker-resume:
	docker start $(SLUG)

# build image and start node with docker
# usage:
# $ make docker-refresh rpc_port=<port> rest_port=<port>
# (defaults are rpc: 50051 and rest: 8000)
docker-refresh: docker-stop docker-build docker-start

docker-watch:
	while inotifywait -r -e close_write .; do (make docker-refresh) done

docker-follow-log:
	tail -F /tmp/pyvincoli-docker.log

docker-follow-console:
	tail -F /tmp/pyvincoli-docker-console.log

# makefile help and guide
# -----------------------

# print makefile help
define help_text
Makefile for $(NAME) v$(VERSION)

Usage: make [COMMAND] [OPTIONS]
Example: make example-command example-option=value


Commands
========

Project setup
  setup-pre-commit    Install pre-commit hook (will execute "make checklist")
  setup               Setup project for development

Code tasks
  checklist           Run all automatic code tasks (formatting, linting, testing...)
  format              Format files with black, isort and trim
  lint                Lint python code with pycodestyle, pyflakes, mccabe, radon, eradicate and mypy
  bump-version        Bump project version
    - type=major|minor|patch (default: patch)
  test-unit           Run unit tests
  test-unit-docker    Run unit tests in a docker with resources
  test-integration    Run integration tests
  test                Run all tests
  check-types         Run static type analysis with mypy (strict)
  init-network        Starts a configured network and wait to manually test on it. Configuration in tests/integration/init.py

Documentation
  serve-docs          Open internal documentation in a web browser
    - port=<port> (default: 9876)

Execution
  start               Start node

Docker
  docker-build        Build docker image
  docker-start        Start node with docker
    - rpc_port=<port> (default: 50051)
    - rest_port=<port> (default: 8000)
  docker-stop         Stop and remove the container that's currently running
  docker-pause        Stop the container that's currently running
  docker-resume       Resume the node that's currently paused
  docker-refresh      Build image and start node with docker
    - rpc_port=<port> (default: 50051)
    - rest_port=<port> (default: 8000)

Help
  help                Show help with full command list
  guide               Show usage guide
endef
export help_text
# show help with full command list
help:
	@echo "$$help_text"

define guide_text
Makefile for $(NAME) v$(VERSION)


Usage guide
===========

Project setup
-------------

- Setup the project when it's freshly cloned:
$ make setup
# activate the virtualenv (or configure it on your IDE)
$ source .venv/bin/activate

Code quality
------------

- Run formatting, linting and testing tasks:
$ make checklist

- Format the project files:
$ make format

- Lint the python code:
$ make lint

- Publish a new version:
$ make bump-version type=major|minor|patch

- Run all tests:
$ make test

- Run unit tests:
$ make test-unit

- Run unit tests in a docker:
$ make test-unit-docker

- Run integration tests:
$ make test-integration

- Analyze types with mypy (strict):
$ make check-types


Documentation
-------------

- See the internal documentation:
$ make serve-doc port=<port>


Execution
---------

- Start the node:
$ make start

- Starts a configured network:
$ make init-network


Docker
------

- Build the docker image:
$ make docker-build

- Start the node with docker:
$ make docker-start rpc_port=<port> rest_port=<port>

- Stop the node container:
$ make docker-stop

- Rebuild and redeploy the node image with the latest changes:
$ make docker-refresh rpc_port=<port> rest_port=<port>

- Pause and resume the currently running node container:
$ make docker-pause
$ make docker-resume
endef
export guide_text
# show usage guide
guide:
	@echo "$$guide_text"
