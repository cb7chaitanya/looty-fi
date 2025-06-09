# Use Node 20 base image (with npm/yarn built-in)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend code
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the TypeScript project
RUN yarn build

# Expose app port
EXPOSE 8080

# Start the app
CMD ["node", "dist/index.js"]
