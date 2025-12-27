# Task API - AWS Lambda Serverless

Production-ready REST API using AWS Lambda, API Gateway, TypeScript, and MongoDB.

## Quick Start

1. Install dependencies: `npm install`
2. Configure MongoDB in `.env.dev`
3. Configure AWS credentials
4. Deploy: `npm run deploy:dev`

## Available Commands

- `npm run local` - Run locally
- `npm run deploy:dev` - Deploy to dev
- `npm run deploy:prod` - Deploy to production
- `npm run logs` - View function logs
- `npm run build` - Build TypeScript

## API Endpoints

- `POST /tasks` - Create task
- `GET /tasks` - Get all tasks
- `GET /tasks/{id}` - Get task by ID
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

echo "# Updated"