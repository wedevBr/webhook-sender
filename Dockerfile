# Use a imagem base oficial do Node.js
FROM node:14

# Cria um diretório de trabalho
WORKDIR /usr/src/app

# Copia o package.json e o package-lock.json
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia o restante do código da aplicação para o diretório de trabalho
COPY . .

# Expõe a porta (opcional, se sua aplicação tiver uma interface web)
# EXPOSE 8080

# Comando para rodar a aplicação
CMD ["node", "index.js"]
