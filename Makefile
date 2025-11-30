# Sokudoku Speed Reading App Makefile

.PHONY: dev format build stop install

install:
	pnpm install

stop: 
	pnpm -F firebase -F hosting stop

# Start all services in development mode
dev: install stop
	pnpm turbo dev

# Format and fix linting issues
format: install
	pnpm turbo lint:fix

# Build hosting app
build:
	pnpm -F hosting build

