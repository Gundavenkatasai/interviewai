FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    node -e "const fs=require('fs'); const p='./node_modules/@react-pdf/hyphenate/package.json'; if(fs.existsSync(p)){ const pkg=JSON.parse(fs.readFileSync(p)); pkg.exports['./*'] = { types: './lib/*.d.ts', import: './lib/*.js', require: './lib/*.js', default: './lib/*.js' }; fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); }"

COPY . .

EXPOSE 8001
CMD ["npm", "run", "dev"]
