FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY apps/api-node/package*.json ./
RUN npm install --legacy-peer-deps && \
    node -e "const fs=require('fs'); const p='./node_modules/@react-pdf/hyphenate/package.json'; if(fs.existsSync(p)){ const pkg=JSON.parse(fs.readFileSync(p)); pkg.exports['./*'] = { types: './lib/*.d.ts', import: './lib/*.js', require: './lib/*.js', default: './lib/*.js' }; fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); }"

# Copy API backend source code
COPY apps/api-node/ ./

# Expose backend port
EXPOSE 8001

# Default environment variables (configurable at runtime)
ENV NODE_ENV=development \
    PORT=8001 \
    MONGODB_URI=mongodb://mongo:27017 \
    MONGODB_DB_NAME=applyhustle

# Start backend server
CMD ["npm", "run", "dev"]
