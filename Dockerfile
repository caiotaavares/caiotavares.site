# Use uma imagem de servidor web como base
FROM nginx:alpine

# Copie os arquivos HTML e CSS para o diretório raiz do servidor web
COPY src/index.html /usr/share/nginx/html/
COPY src/style.css /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/

# Exponha a porta 80 para acessar o servidor web
EXPOSE 8080

# Comando para iniciar o servidor web quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]