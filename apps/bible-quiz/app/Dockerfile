FROM oven/bun:1 AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source files
COPY . .

# Build the application
RUN bun run build

# Production image
FROM oven/bun:1 AS runner
WORKDIR /app

# Install serve for static file serving
RUN bun add -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
