# Multi-stage production build for MoonWitness Corpus Engine
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages/ ./packages/
COPY datasets/ ./datasets/
COPY scripts/ ./scripts/
COPY apps/ ./apps/
COPY spec/ ./spec/
COPY release/ ./release/

RUN pnpm install --frozen-lockfile
RUN pnpm build:sqlite

# Final lean runtime image
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3030

COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 3030

CMD ["node", "packages/server/src/index.js"]
