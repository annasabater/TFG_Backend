# Base iamge
FROM node:16-alpine AS base

# Stage 1: Dependencies
FROM base AS deps
WORKDIR /app

# Copy dependency files and install
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Copy the application ode
COPY . .

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Compile the application
RUN npm run build

# Stage 3: Run the application
FROM base AS runner
WORKDIR /app

COPY package.json package-lock.json ./

# Copy the compiled output and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

# Expose the port
EXPOSE 9000

# Run the application
CMD ["node", "build/server.js"]